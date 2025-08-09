import { Request, Response } from 'express';
import crypto from 'crypto';
import { WebSocketService } from '../services/websocket.service';
import { WebhookPayload } from '../types';
import db from '../config/database';

export class WebhooksController {
  private wsService?: WebSocketService;

  constructor(wsService?: WebSocketService) {
    this.wsService = wsService;
  }

  // Verify GitHub webhook signature
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('No webhook secret configured');
      return true; // Allow in development
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  // Handle GitHub webhook
  async handleGitHubWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-hub-signature-256'] as string;
      const event = req.headers['x-github-event'] as string;
      const payload = req.body;

      // Verify signature in production
      if (process.env.NODE_ENV === 'production' && signature) {
        const isValid = this.verifyWebhookSignature(
          JSON.stringify(payload),
          signature
        );
        
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Log webhook event
      db.run(
        'INSERT INTO webhook_logs (event_type, payload, processed) VALUES (?, ?, ?)',
        [event, JSON.stringify(payload), 0]
      );

      // Process different event types
      switch (event) {
        case 'pull_request':
          await this.handlePullRequestEvent(payload);
          break;
        case 'pull_request_review':
          await this.handlePullRequestReviewEvent(payload);
          break;
        case 'pull_request_review_comment':
          await this.handlePullRequestCommentEvent(payload);
          break;
        case 'issues':
          await this.handleIssueEvent(payload);
          break;
        case 'issue_comment':
          await this.handleIssueCommentEvent(payload);
          break;
        case 'push':
          await this.handlePushEvent(payload);
          break;
        case 'status':
          await this.handleStatusEvent(payload);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      // Broadcast to WebSocket clients
      if (this.wsService) {
        this.wsService.handleWebhookEvent({
          action: payload.action || event,
          pull_request: payload.pull_request,
          issue: payload.issue,
          repository: payload.repository,
          sender: payload.sender,
        });
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  private async handlePullRequestEvent(payload: any) {
    const action = payload.action;
    const pr = payload.pull_request;
    const repo = payload.repository;

    console.log(`Pull request ${action}: #${pr.number} in ${repo.full_name}`);

    // Update cache based on action
    if (['opened', 'closed', 'reopened', 'edited', 'synchronize'].includes(action)) {
      // Clear cache for this repository
      const { CacheService } = await import('../services/cache.service');
      const cacheService = new CacheService();
      await cacheService.clear(`prs:*${repo.full_name}*`);
    }

    // Store/update PR in database
    if (pr) {
      db.run(
        `INSERT OR REPLACE INTO pull_requests 
         (id, number, title, branch_name, base_branch, repository_id, status, description, author, data, last_updated, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `pr-${repo.full_name}-${pr.number}`,
          pr.number,
          pr.title,
          pr.head.ref,
          pr.base.ref,
          repo.full_name,
          pr.draft ? 'draft' : pr.state,
          pr.body || '',
          pr.user.login,
          JSON.stringify(pr),
          pr.updated_at,
          pr.created_at,
        ]
      );
    }
  }

  private async handlePullRequestReviewEvent(payload: any) {
    const action = payload.action;
    const review = payload.review;
    const pr = payload.pull_request;
    const repo = payload.repository;

    console.log(`Pull request review ${action}: PR #${pr.number} in ${repo.full_name}`);

    // Clear cache
    const { CacheService } = await import('../services/cache.service');
    const cacheService = new CacheService();
    await cacheService.clear(`prs:*${repo.full_name}*`);
  }

  private async handlePullRequestCommentEvent(payload: any) {
    const action = payload.action;
    const comment = payload.comment;
    const pr = payload.pull_request;
    const repo = payload.repository;

    console.log(`Pull request comment ${action}: PR #${pr.number} in ${repo.full_name}`);
  }

  private async handleIssueEvent(payload: any) {
    const action = payload.action;
    const issue = payload.issue;
    const repo = payload.repository;

    console.log(`Issue ${action}: #${issue.number} in ${repo.full_name}`);

    // Store/update issue in database
    if (issue && !issue.pull_request) {
      db.run(
        `INSERT OR REPLACE INTO issues 
         (id, number, title, description, state, repository_id, author, data, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `issue-${repo.full_name}-${issue.number}`,
          issue.number,
          issue.title,
          issue.body || '',
          issue.state,
          repo.full_name,
          issue.user.login,
          JSON.stringify(issue),
          issue.created_at,
          issue.updated_at,
        ]
      );
    }
  }

  private async handleIssueCommentEvent(payload: any) {
    const action = payload.action;
    const comment = payload.comment;
    const issue = payload.issue;
    const repo = payload.repository;

    console.log(`Issue comment ${action}: Issue #${issue.number} in ${repo.full_name}`);
  }

  private async handlePushEvent(payload: any) {
    const ref = payload.ref;
    const repo = payload.repository;
    const commits = payload.commits;

    console.log(`Push to ${ref} in ${repo.full_name}: ${commits.length} commits`);
  }

  private async handleStatusEvent(payload: any) {
    const state = payload.state;
    const repo = payload.repository;
    const context = payload.context;

    console.log(`Status ${state} for ${context} in ${repo.full_name}`);
  }
}
