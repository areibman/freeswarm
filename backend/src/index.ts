import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import cookieParser from 'cookie-parser';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import axios from 'axios';
import { initDatabase } from './config/database';
import { WebSocketService } from './services/websocket.service';
import { PullRequestsController } from './controllers/pullRequests.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { CacheService } from './services/cache.service';
import db from './config/database';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Initialize controllers
const pullRequestsController = new PullRequestsController(wsService);
const webhooksController = new WebhooksController(wsService);
const cacheService = new CacheService();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Utility: sign JWT and set cookie
function setSessionCookie(res: express.Response, payload: any) {
  const token = sign(payload, (process.env.JWT_SECRET || 'dev_secret') as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d',
  } as any);
  const cookieName = process.env.COOKIE_NAME || 'fs_session';
  const secure = (process.env.COOKIE_SECURE || 'false') === 'true';
  const sameSite = (process.env.COOKIE_SAME_SITE as any) || 'lax';
  const domain = process.env.COOKIE_DOMAIN || undefined;
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/',
  });
}

// Helpers
function decodeSession(req: express.Request): { userId: string; login: string; githubAccessToken?: string } | null {
  const cookieName = process.env.COOKIE_NAME || 'fs_session';
  const token = (req as any).cookies?.[cookieName];
  if (!token) return null;
  try {
    const decoded = verify(token, (process.env.JWT_SECRET || 'dev_secret') as string) as JwtPayload | string;
    if (typeof decoded === 'string') return null;
    return {
      userId: decoded.userId as string,
      login: decoded.login as string,
      githubAccessToken: decoded.githubAccessToken as string | undefined,
    };
  } catch {
    return null;
  }
}

function getAccessTokenFromRequest(req: express.Request): string | undefined {
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  if (headerToken) return headerToken;
  const session = decodeSession(req);
  return session?.githubAccessToken;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connectedClients: wsService.getConnectedClientsCount(),
    cacheStats: cacheService.getStats(),
  });
});

// OAuth routes
app.get('/auth/github/login', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/github/callback`;
  const scope = ['read:user', 'user:email', 'repo'].join(' ');
  const state = Math.random().toString(36).slice(2);
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
});

app.get('/auth/github/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.status(400).send('Missing code');

    const clientId = process.env.GITHUB_CLIENT_ID as string;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET as string;

    const tokenResp = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: clientId, client_secret: clientSecret, code },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResp.data.access_token as string;
    if (!accessToken) return res.status(400).send('Failed to obtain access token');

    // Fetch user profile
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: accessToken });
    const { data: user } = await octokit.users.getAuthenticated();

    // Persist or update user in DB
    const userId = user.node_id; // stable id
    const prefs = JSON.stringify({});
    db.run(
      `INSERT INTO users (id, github_id, username, email, avatar_url, access_token, preferences, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET username=excluded.username, email=excluded.email, avatar_url=excluded.avatar_url, access_token=excluded.access_token, updated_at=CURRENT_TIMESTAMP`,
      [userId, user.id?.toString(), user.login, user.email || null, user.avatar_url || null, accessToken, prefs]
    );

    // Set session cookie (JWT with minimal info)
    setSessionCookie(res, {
      userId,
      login: user.login,
      githubAccessToken: accessToken,
    });

    // Redirect back to frontend
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(frontend);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
});

app.post('/auth/logout', (req, res) => {
  const cookieName = process.env.COOKIE_NAME || 'fs_session';
  res.clearCookie(cookieName, { path: '/' });
  res.json({ success: true });
});

app.get('/auth/session', (req, res) => {
  try {
    const session = decodeSession(req);
    if (!session) return res.json({ authenticated: false });
    res.json({ authenticated: true, user: { id: session.userId, login: session.login } });
  } catch {
    res.json({ authenticated: false });
  }
});

// API Routes

// Pull Requests
app.get('/api/pull-requests', (req, res) => pullRequestsController.getAllPullRequests(req, res));
app.get('/api/pull-requests/cached', (req, res) => pullRequestsController.getCachedPullRequests(req, res));
app.get('/api/repos/:owner/:repo/pull-requests', (req, res) => pullRequestsController.getRepositoryPullRequests(req, res));
app.put('/api/repos/:owner/:repo/pull-requests/:prNumber/status', (req, res) => pullRequestsController.updatePullRequestStatus(req, res));
app.post('/api/repos/:owner/:repo/pull-requests/:prNumber/comments', (req, res) => pullRequestsController.addComment(req, res));

// Webhooks
app.post('/api/webhooks/github', (req, res) => webhooksController.handleGitHubWebhook(req, res));

// User preferences endpoint
app.get('/api/user/preferences', (req, res) => {
  res.json({
    darkMode: false,
    repositories: [],
    filters: {},
    notifications: true,
  });
});

app.put('/api/user/preferences', (req, res) => {
  res.json({ success: true, preferences: req.body });
});

// Connected repositories for authenticated user
app.get('/api/user/connected-repositories', (req, res) => {
  const session = decodeSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  db.all(
    'SELECT repository_id as repo FROM user_repositories WHERE user_id = ?',
    [session.userId],
    (err: any, rows: any[]) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      const repos = rows.map(r => r.repo);
      res.json({ repositories: repos });
    }
  );
});

app.post('/api/user/connected-repositories', (req, res) => {
  const session = decodeSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const repositories: string[] = req.body?.repositories || [];
  db.serialize(() => {
    db.run('DELETE FROM user_repositories WHERE user_id = ?', [session.userId]);
    const stmt = (db as any).prepare('INSERT OR IGNORE INTO user_repositories (user_id, repository_id) VALUES (?, ?)');
    for (const repo of repositories) {
      stmt.run([session.userId, repo]);
      // Ensure repositories table has an entry
      db.run(
        `INSERT OR IGNORE INTO repositories (id, name, full_name, owner, private, description, default_branch, url)
         VALUES (?, ?, ?, ?, 0, '', 'main', '')`,
        [repo, repo.split('/')[1] || repo, repo, repo.split('/')[0] || '']
      );
    }
    stmt.finalize?.();
  });
  res.json({ success: true });
});

// Repositories endpoint
app.get('/api/repositories', async (req, res) => {
  try {
    const { GitHubService } = await import('./services/github.service');
    const accessToken = getAccessTokenFromRequest(req);
    const githubService = new GitHubService(accessToken);
    const repos = await githubService.fetchUserRepositories();
    res.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Issues endpoint
app.get('/api/repos/:owner/:repo/issues', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'all' } = req.query;
    const { GitHubService } = await import('./services/github.service');
    const accessToken = getAccessTokenFromRequest(req);
    const githubService = new GitHubService(accessToken);
    const issues = await githubService.fetchIssues(owner, repo, state as any);
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Cache management endpoints
app.delete('/api/cache', async (req, res) => {
  try {
    await cacheService.clear('*');
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.get('/api/cache/stats', (req, res) => {
  res.json(cacheService.getStats());
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
initDatabase();

// Clean expired cache entries periodically
setInterval(() => {
  cacheService.cleanExpired().catch(console.error);
}, 60000); // Every minute

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 GitHub webhook endpoint: http://localhost:${PORT}/api/webhooks/github`);
  console.log(`🌍 CORS enabled for: ${process.env.ALLOWED_ORIGINS}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, wsService };
