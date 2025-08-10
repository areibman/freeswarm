import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { GitHubOAuthService } from '../services/github-oauth.service';
import jwt from 'jsonwebtoken';

export class AuthController {
  private authService: AuthService;
  private githubOAuthService: GitHubOAuthService;

  constructor() {
    this.authService = new AuthService();
    this.githubOAuthService = new GitHubOAuthService();
  }

  /**
   * Initiates GitHub OAuth flow
   */
  async initiateGitHubOAuth(req: Request, res: Response) {
    try {
      const redirectUrl = this.githubOAuthService.getAuthorizationUrl();
      res.json({ redirectUrl });
    } catch (error) {
      console.error('Error initiating GitHub OAuth:', error);
      res.status(500).json({ error: 'Failed to initiate GitHub OAuth' });
    }
  }

  /**
   * Handles GitHub OAuth callback
   */
  async handleGitHubCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      // Exchange code for access token
      const tokenData = await this.githubOAuthService.exchangeCodeForToken(code);
      
      // Get user data from GitHub
      const githubUser = await this.githubOAuthService.getUserData(tokenData.access_token);
      
      // Create or update user in database
      const user = await this.authService.findOrCreateUser({
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        email: githubUser.email,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
        githubAccessToken: tokenData.access_token,
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          githubId: user.githubId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error handling GitHub callback:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(req: Request, res: Response) {
    try {
      const user = await this.authService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        connectedRepos: user.connectedRepos || [],
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response) {
    // Since we're using JWT, we just need to tell the client to remove the token
    res.json({ message: 'Logged out successfully' });
  }

  /**
   * Connect a repository to the user's account
   */
  async connectRepository(req: Request, res: Response) {
    try {
      const { owner, repo } = req.body;
      const userId = req.user.userId;

      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      // Verify user has access to the repository
      const user = await this.authService.getUserById(userId);
      const hasAccess = await this.githubOAuthService.verifyRepoAccess(
        user.githubAccessToken,
        owner,
        repo
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have access to this repository' });
      }

      // Add repository to user's connected repos
      await this.authService.connectRepository(userId, { owner, repo });

      res.json({ 
        message: 'Repository connected successfully',
        repository: { owner, repo }
      });
    } catch (error) {
      console.error('Error connecting repository:', error);
      res.status(500).json({ error: 'Failed to connect repository' });
    }
  }

  /**
   * Disconnect a repository from the user's account
   */
  async disconnectRepository(req: Request, res: Response) {
    try {
      const { owner, repo } = req.params;
      const userId = req.user.userId;

      await this.authService.disconnectRepository(userId, { owner, repo });

      res.json({ 
        message: 'Repository disconnected successfully',
        repository: { owner, repo }
      });
    } catch (error) {
      console.error('Error disconnecting repository:', error);
      res.status(500).json({ error: 'Failed to disconnect repository' });
    }
  }

  /**
   * Get user's connected repositories
   */
  async getConnectedRepositories(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const user = await this.authService.getUserById(userId);
      
      res.json({ 
        repositories: user.connectedRepos || []
      });
    } catch (error) {
      console.error('Error getting connected repositories:', error);
      res.status(500).json({ error: 'Failed to get connected repositories' });
    }
  }
}