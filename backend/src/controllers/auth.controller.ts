import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GitHubService } from '../services/github.service';
import db from '../config/database';
import { promisify } from 'util';

const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

export class AuthController {
  // Exchange GitHub OAuth code for access token and create/update user
  async handleGitHubCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code as string,
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        return res.status(400).json({ error: tokenData.error_description || 'Failed to exchange code for token' });
      }

      const accessToken = tokenData.access_token;
      
      // Get user info from GitHub
      const githubService = new GitHubService(accessToken);
      const githubUser = await githubService.getAuthenticatedUser();

      // Create or update user in database
      const userId = `user-${githubUser.id}`;
      const existingUser = await dbGet('SELECT * FROM users WHERE github_id = ?', [githubUser.id.toString()]);

      if (existingUser) {
        // Update existing user
        await dbRun(
          'UPDATE users SET username = ?, email = ?, avatar_url = ?, access_token = ?, updated_at = CURRENT_TIMESTAMP WHERE github_id = ?',
          [githubUser.login, githubUser.email, githubUser.avatar_url, accessToken, githubUser.id.toString()]
        );
      } else {
        // Create new user
        await dbRun(
          'INSERT INTO users (id, github_id, username, email, avatar_url, access_token) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, githubUser.id.toString(), githubUser.login, githubUser.email, githubUser.avatar_url, accessToken]
        );
      }

      // Create JWT token
      const jwtToken = jwt.sign(
        { userId, githubId: githubUser.id, username: githubUser.login },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        token: jwtToken,
        user: {
          id: userId,
          githubId: githubUser.id,
          username: githubUser.login,
          email: githubUser.email,
          avatarUrl: githubUser.avatar_url,
        },
      });
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get current user info
  async getCurrentUser(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
      
      const user = await dbGet('SELECT id, github_id, username, email, avatar_url, preferences FROM users WHERE id = ?', [decoded.userId]);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        githubId: user.github_id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
      });
    } catch (error) {
      console.error('Get current user error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update user preferences
  async updateUserPreferences(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
      
      const { preferences } = req.body;
      
      await dbRun(
        'UPDATE users SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(preferences), decoded.userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error('Update preferences error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Refresh user's GitHub access token
  async refreshGitHubToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
      
      const user = await dbGet('SELECT access_token FROM users WHERE id = ?', [decoded.userId]);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Test if current token is still valid
      const githubService = new GitHubService(user.access_token);
      try {
        await githubService.getAuthenticatedUser();
        res.json({ success: true, message: 'Token is still valid' });
      } catch (error) {
        // Token is invalid, user needs to re-authenticate
        res.status(401).json({ error: 'GitHub token has expired, please re-authenticate' });
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}