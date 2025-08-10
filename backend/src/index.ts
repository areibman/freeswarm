import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import { initDatabase } from './config/database';
import { WebSocketService } from './services/websocket.service';
import { PullRequestsController } from './controllers/pullRequests.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { AuthController } from './controllers/auth.controller';
import { CacheService } from './services/cache.service';
import { authenticateToken, optionalAuth } from './middleware/auth.middleware';

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
const authController = new AuthController();
const cacheService = new CacheService();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// API Routes

// Authentication Routes
app.get('/api/auth/github', (req, res) => authController.initiateGitHubOAuth(req, res));
app.get('/api/auth/github/callback', (req, res) => authController.handleGitHubCallback(req, res));
app.get('/api/auth/user', authenticateToken, (req, res) => authController.getCurrentUser(req, res));
app.post('/api/auth/logout', authenticateToken, (req, res) => authController.logout(req, res));

// Repository Management Routes (Protected)
app.post('/api/user/repositories', authenticateToken, (req, res) => authController.connectRepository(req, res));
app.delete('/api/user/repositories/:owner/:repo', authenticateToken, (req, res) => authController.disconnectRepository(req, res));
app.get('/api/user/repositories', authenticateToken, (req, res) => authController.getConnectedRepositories(req, res));

// Pull Requests (Now uses authenticated user's repos)
app.get('/api/pull-requests', optionalAuth, async (req, res) => {
  // If user is authenticated, use their connected repos
  if (req.user) {
    const authService = (await import('./services/auth.service')).AuthService;
    const service = new authService();
    const user = await service.getUserById(req.user.userId);
    if (user && user.connectedRepos.length > 0) {
      req.query.repositories = user.connectedRepos.map(r => `${r.owner}/${r.repo}`).join(',');
    }
  }
  pullRequestsController.getAllPullRequests(req, res);
});

app.get('/api/pull-requests/cached', (req, res) => pullRequestsController.getCachedPullRequests(req, res));
app.get('/api/repos/:owner/:repo/pull-requests', optionalAuth, (req, res) => pullRequestsController.getRepositoryPullRequests(req, res));
app.put('/api/repos/:owner/:repo/pull-requests/:prNumber/status', authenticateToken, (req, res) => pullRequestsController.updatePullRequestStatus(req, res));
app.post('/api/repos/:owner/:repo/pull-requests/:prNumber/comments', authenticateToken, (req, res) => pullRequestsController.addComment(req, res));

// Webhooks
app.post('/api/webhooks/github', (req, res) => webhooksController.handleGitHubWebhook(req, res));

// User preferences endpoint (Protected)
app.get('/api/user/preferences', authenticateToken, async (req, res) => {
  // Fetch from database based on authenticated user
  const authService = (await import('./services/auth.service')).AuthService;
  const service = new authService();
  const user = await service.getUserById(req.user!.userId);
  
  res.json({
    darkMode: false,
    repositories: user?.connectedRepos || [],
    filters: {},
    notifications: true,
  });
});

app.put('/api/user/preferences', authenticateToken, (req, res) => {
  // This would normally update database
  res.json({ success: true, preferences: req.body });
});

// Repositories endpoint (Protected)
app.get('/api/repositories', authenticateToken, async (req, res) => {
  try {
    const authService = (await import('./services/auth.service')).AuthService;
    const service = new authService();
    const user = await service.getUserById(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { GitHubService } = await import('./services/github.service');
    const githubService = new GitHubService(user.githubAccessToken);
    
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
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
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
