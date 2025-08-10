import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { GitHubService } from '../services/github.service';
import db from '../config/database';
import { promisify } from 'util';

const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

export class RepositoriesController {
  // Get user's connected repositories
  async getUserRepositories(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;

      const repositories = await dbAll(`
        SELECT r.*, ur.created_at as connected_at
        FROM repositories r
        JOIN user_repositories ur ON r.id = ur.repository_id
        WHERE ur.user_id = ?
        ORDER BY ur.created_at DESC
      `, [decoded.userId]);

      res.json(repositories);
    } catch (error) {
      console.error('Get user repositories error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get available repositories from GitHub
  async getAvailableRepositories(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;

      // Get user's GitHub access token
      const user = await dbGet('SELECT access_token FROM users WHERE id = ?', [decoded.userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch repositories from GitHub
      const githubService = new GitHubService(user.access_token);
      const githubRepos = await githubService.fetchUserRepositories();

      // Get already connected repositories
      const connectedRepos = await dbAll(`
        SELECT r.full_name
        FROM repositories r
        JOIN user_repositories ur ON r.id = ur.repository_id
        WHERE ur.user_id = ?
      `, [decoded.userId]);

      const connectedRepoNames = new Set(connectedRepos.map(r => r.full_name));

      // Filter out already connected repositories
      const availableRepos = githubRepos.filter(repo => !connectedRepoNames.has(repo.fullName));

      res.json(availableRepos);
    } catch (error) {
      console.error('Get available repositories error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Connect a repository
  async connectRepository(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;

      const { repositoryId, fullName, name, owner, isPrivate, description, defaultBranch, url } = req.body;

      if (!repositoryId || !fullName) {
        return res.status(400).json({ error: 'Repository ID and full name are required' });
      }

      // Check if repository already exists
      const existingRepo = await dbGet('SELECT id FROM repositories WHERE id = ?', [repositoryId]);
      
      if (!existingRepo) {
        // Create repository record
        await dbRun(`
          INSERT INTO repositories (id, name, full_name, owner, private, description, default_branch, url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [repositoryId, name, fullName, owner, isPrivate ? 1 : 0, description, defaultBranch, url]);
      }

      // Check if user already connected to this repository
      const existingConnection = await dbGet(
        'SELECT * FROM user_repositories WHERE user_id = ? AND repository_id = ?',
        [decoded.userId, repositoryId]
      );

      if (existingConnection) {
        return res.status(400).json({ error: 'Repository already connected' });
      }

      // Connect user to repository
      await dbRun(
        'INSERT INTO user_repositories (user_id, repository_id) VALUES (?, ?)',
        [decoded.userId, repositoryId]
      );

      res.json({ success: true, message: 'Repository connected successfully' });
    } catch (error) {
      console.error('Connect repository error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Disconnect a repository
  async disconnectRepository(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;

      const { repositoryId } = req.params;

      if (!repositoryId) {
        return res.status(400).json({ error: 'Repository ID is required' });
      }

      // Check if connection exists
      const existingConnection = await dbGet(
        'SELECT * FROM user_repositories WHERE user_id = ? AND repository_id = ?',
        [decoded.userId, repositoryId]
      );

      if (!existingConnection) {
        return res.status(404).json({ error: 'Repository connection not found' });
      }

      // Remove connection
      await dbRun(
        'DELETE FROM user_repositories WHERE user_id = ? AND repository_id = ?',
        [decoded.userId, repositoryId]
      );

      res.json({ success: true, message: 'Repository disconnected successfully' });
    } catch (error) {
      console.error('Disconnect repository error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get pull requests for connected repositories
  async getRepositoryPullRequests(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;

      const { repositoryId } = req.params;
      const { state = 'all' } = req.query;

      // Verify user has access to this repository
      const connection = await dbGet(
        'SELECT * FROM user_repositories WHERE user_id = ? AND repository_id = ?',
        [decoded.userId, repositoryId]
      );

      if (!connection) {
        return res.status(403).json({ error: 'Access denied to this repository' });
      }

      // Get repository details
      const repository = await dbGet('SELECT * FROM repositories WHERE id = ?', [repositoryId]);
      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      // Get user's GitHub access token
      const user = await dbGet('SELECT access_token FROM users WHERE id = ?', [decoded.userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch pull requests from GitHub
      const githubService = new GitHubService(user.access_token);
      const pullRequests = await githubService.fetchPullRequests(
        repository.owner, 
        repository.name, 
        state as 'open' | 'closed' | 'all'
      );

      res.json(pullRequests);
    } catch (error) {
      console.error('Get repository pull requests error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get issues for connected repositories
  async getRepositoryIssues(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;

      const { repositoryId } = req.params;
      const { state = 'all' } = req.query;

      // Verify user has access to this repository
      const connection = await dbGet(
        'SELECT * FROM user_repositories WHERE user_id = ? AND repository_id = ?',
        [decoded.userId, repositoryId]
      );

      if (!connection) {
        return res.status(403).json({ error: 'Access denied to this repository' });
      }

      // Get repository details
      const repository = await dbGet('SELECT * FROM repositories WHERE id = ?', [repositoryId]);
      if (!repository) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      // Get user's GitHub access token
      const user = await dbGet('SELECT access_token FROM users WHERE id = ?', [decoded.userId]);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch issues from GitHub
      const githubService = new GitHubService(user.access_token);
      const issues = await githubService.fetchIssues(
        repository.owner, 
        repository.name, 
        state as 'open' | 'closed' | 'all'
      );

      res.json(issues);
    } catch (error) {
      console.error('Get repository issues error:', error);
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}