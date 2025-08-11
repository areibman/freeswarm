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

  // Launch a per-branch preview environment for a PR
  async launchPreview(req: Request, res: Response) {
    try {
      const { owner, repo, prNumber } = req.params as { owner: string; repo: string; prNumber: string }
      const { branchName } = req.body as { branchName?: string }
      const accessToken = req.headers.authorization?.replace('Bearer ', '')

      if (!branchName) {
        return res.status(400).json({ error: 'branchName is required' })
      }

      // Create or fetch preview URL
      const { PreviewService } = await import('../services/preview.service')
      const previewService = new PreviewService()
      const liveLink = previewService.getOrCreatePreviewUrl({
        owner,
        repo,
        branchName,
        prNumber: parseInt(prNumber, 10),
      })

      const prId = `pr-${owner}/${repo}-${parseInt(prNumber, 10)}`

      // Update DB cached PR JSON with liveLink if present
      await new Promise<void>((resolve) => {
        db.get(
          'SELECT data FROM pull_requests WHERE id = ? LIMIT 1',
          [prId],
          (err, row: any) => {
            if (err) {
              console.error('DB read error (preview):', err)
              return resolve()
            }
            if (!row) return resolve()
            try {
              const data = row.data ? JSON.parse(row.data) : {}
              data.liveLink = liveLink
              db.run(
                'UPDATE pull_requests SET data = ? WHERE id = ?',
                [JSON.stringify(data), prId],
                (updateErr) => {
                  if (updateErr) console.error('DB update error (preview):', updateErr)
                  resolve()
                }
              )
            } catch (e) {
              console.error('Failed to update PR data JSON (preview):', e)
              resolve()
            }
          }
        )
      })

      // Notify clients for ONLY this PR
      this.wsService?.broadcastPRUpdate(prId, { liveLink })

      return res.json({ success: true, liveLink })
    } catch (error) {
      console.error('Error launching preview:', error)
      res.status(500).json({ error: 'Failed to launch preview' })
    }
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
