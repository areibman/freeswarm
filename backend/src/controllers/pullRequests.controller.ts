import { Request, Response } from 'express';
import { GitHubService } from '../services/github.service';
import { CacheService } from '../services/cache.service';
import { WebSocketService } from '../services/websocket.service';
import db from '../config/database';

export class PullRequestsController {
  private cacheService: CacheService;
  private wsService?: WebSocketService;

  constructor(wsService?: WebSocketService) {
    this.cacheService = new CacheService();
    this.wsService = wsService;
  }

  // Get all pull requests from multiple repositories
  async getAllPullRequests(req: Request, res: Response) {
    try {
      const { repositories, state = 'all', useCache = true } = req.query;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!repositories) {
        return res.status(400).json({ error: 'Repositories parameter is required' });
      }

      const repoList = (repositories as string).split(',');
      const cacheKey = `prs:${repositories}:${state}`;

      // Check cache if enabled
      if (useCache === 'true' || useCache === true) {
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      }

      const githubService = new GitHubService(accessToken);
      const allPRs = [];

      for (const repo of repoList) {
        const [owner, name] = repo.split('/');
        if (!owner || !name) {
          console.error(`Invalid repository format: ${repo}`);
          continue;
        }

        try {
          const prs = await githubService.fetchPullRequests(owner, name, state as any);
          allPRs.push(...prs);

          // Store in database for offline access
          for (const pr of prs) {
            db.run(
              `INSERT OR REPLACE INTO pull_requests 
               (id, number, title, branch_name, base_branch, repository_id, status, description, author, data, last_updated, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                pr.id,
                pr.number,
                pr.title,
                pr.branchName,
                pr.baseBranch,
                repo,
                pr.status,
                pr.description,
                pr.author,
                JSON.stringify(pr),
                pr.lastUpdated,
                pr.created,
              ]
            );
          }
        } catch (error) {
          console.error(`Error fetching PRs for ${repo}:`, error);
        }
      }

      // Cache the results
      await this.cacheService.set(cacheKey, allPRs, 300); // 5 minutes

      res.json(allPRs);
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      res.status(500).json({ error: 'Failed to fetch pull requests' });
    }
  }

  // Get pull requests for a specific repository
  async getRepositoryPullRequests(req: Request, res: Response) {
    try {
      const { owner, repo } = req.params;
      const { state = 'all' } = req.query;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      const githubService = new GitHubService(accessToken);
      const prs = await githubService.fetchPullRequests(owner, repo, state as any);

      res.json(prs);
    } catch (error) {
      console.error('Error fetching repository pull requests:', error);
      res.status(500).json({ error: 'Failed to fetch repository pull requests' });
    }
  }

  // Update pull request status
  async updatePullRequestStatus(req: Request, res: Response) {
    try {
      const { owner, repo, prNumber } = req.params;
      const { action } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!['close', 'reopen', 'merge'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Must be close, reopen, or merge' });
      }

      const githubService = new GitHubService(accessToken);
      await githubService.updatePullRequestStatus(owner, repo, parseInt(prNumber), action);

      // Broadcast update via WebSocket
      if (this.wsService) {
        this.wsService.broadcastPRUpdate(`pr-${owner}/${repo}-${prNumber}`, { status: action === 'close' ? 'closed' : action === 'merge' ? 'merged' : 'open' });
      }

      // Clear cache
      await this.cacheService.clear(`prs:*`);

      res.json({ success: true, message: `Pull request ${action}d successfully` });
    } catch (error) {
      console.error('Error updating pull request status:', error);
      res.status(500).json({ error: 'Failed to update pull request status' });
    }
  }

  // Add comment to pull request
  async addComment(req: Request, res: Response) {
    try {
      const { owner, repo, prNumber } = req.params;
      const { comment } = req.body;
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      if (!comment) {
        return res.status(400).json({ error: 'Comment is required' });
      }

      const githubService = new GitHubService(accessToken);
      await githubService.createPullRequestComment(owner, repo, parseInt(prNumber), comment);

      res.json({ success: true, message: 'Comment added successfully' });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  // Deploy VM for a specific pull request branch
  async deployPreview(req: Request, res: Response) {
    try {
      const { owner, repo, prNumber } = req.params;
      const { branchName } = req.body;

      if (!branchName) {
        return res.status(400).json({ error: 'Branch name is required' });
      }

      const prId = `pr-${owner}/${repo}-${prNumber}`;

      // Check if there's already an active deployment for this PR
      const existingDeployment = await new Promise<any>((resolve, reject) => {
        db.get(
          `SELECT * FROM deployments 
           WHERE pr_id = ? AND status IN ('deploying', 'deployed')
           ORDER BY created_at DESC 
           LIMIT 1`,
          [prId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingDeployment) {
        if (existingDeployment.status === 'deploying') {
          return res.status(409).json({ 
            error: 'Deployment already in progress',
            message: `A deployment is already in progress for branch ${branchName}`
          });
        }
        if (existingDeployment.status === 'deployed') {
          // Return existing deployment info
          return res.json({
            success: true,
            deploymentId: existingDeployment.id,
            previewUrl: existingDeployment.preview_url,
            status: 'deployed',
            message: `VM already deployed for branch ${branchName}`,
            existing: true
          });
        }
      }

      // Generate a unique deployment ID
      const deploymentId = `deploy-${owner}-${repo}-${prNumber}-${Date.now()}`;
      
      // Store deployment status in database
      db.run(
        `INSERT INTO deployments (id, pr_id, branch_name, status, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [deploymentId, prId, branchName, 'deploying', new Date().toISOString()]
      );

      // Broadcast deploying status
      if (this.wsService) {
        this.wsService.broadcastDeployment({
          prNumber,
          branchName,
          repository: `${owner}/${repo}`,
          status: 'deploying'
        });
      }

      // Simulate VM deployment (replace with actual deployment logic)
      // In a real implementation, this would trigger your VM provisioning service
      setTimeout(() => {
        const previewUrl = `https://preview-${prNumber}.${repo}.example.com`;
        
        // Update deployment record
        db.run(
          `UPDATE deployments 
           SET status = ?, preview_url = ?, updated_at = ?
           WHERE id = ?`,
          ['deployed', previewUrl, new Date().toISOString(), deploymentId]
        );

        // Update PR with preview link
        db.run(
          `UPDATE pull_requests 
           SET live_link = ?, deployment_status = ?
           WHERE repository_id = ? AND number = ?`,
          [previewUrl, 'deployed', `${owner}/${repo}`, prNumber]
        );

        // Broadcast deployment complete
        if (this.wsService) {
          this.wsService.broadcastDeployment({
            prNumber,
            branchName,
            repository: `${owner}/${repo}`,
            status: 'deployed',
            previewUrl
          });
        }
      }, 5000); // Simulate 5 second deployment time

      res.json({
        success: true,
        deploymentId,
        status: 'deploying',
        message: `VM deployment started for branch ${branchName}`
      });

    } catch (error) {
      console.error('Error deploying preview:', error);
      
      // Broadcast deployment failure
      if (this.wsService) {
        const { owner, repo, prNumber } = req.params;
        const { branchName } = req.body;
        this.wsService.broadcastDeployment({
          prNumber,
          branchName,
          repository: `${owner}/${repo}`,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      res.status(500).json({ 
        error: 'Failed to deploy preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get deployment status for a pull request
  async getDeploymentStatus(req: Request, res: Response) {
    try {
      const { owner, repo, prNumber } = req.params;
      
      const deployment = await new Promise<any>((resolve, reject) => {
        db.get(
          `SELECT * FROM deployments 
           WHERE pr_id = ? 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [`pr-${owner}/${repo}-${prNumber}`],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!deployment) {
        return res.status(404).json({ error: 'No deployment found' });
      }

      res.json(deployment);
    } catch (error) {
      console.error('Error fetching deployment status:', error);
      res.status(500).json({ error: 'Failed to fetch deployment status' });
    }
  }

  // Get cached pull requests (offline mode)
  async getCachedPullRequests(req: Request, res: Response) {
    try {
      const { repositories } = req.query;

      let query = 'SELECT data FROM pull_requests';
      const params = [];

      if (repositories) {
        const repoList = (repositories as string).split(',');
        query += ' WHERE repository_id IN (' + repoList.map(() => '?').join(',') + ')';
        params.push(...repoList);
      }

      db.all(query, params, (err, rows: any[]) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to fetch cached pull requests' });
        }

        const prs = rows.map(row => JSON.parse(row.data));
        res.json(prs);
      });
    } catch (error) {
      console.error('Error fetching cached pull requests:', error);
      res.status(500).json({ error: 'Failed to fetch cached pull requests' });
    }
  }
}
