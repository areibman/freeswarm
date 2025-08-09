import { Octokit } from '@octokit/rest';
import { PullRequest, FileChange, UpdateLog, Repository, Issue } from '../types';
import dotenv from 'dotenv';

dotenv.config();

export class GitHubService {
  private octokit: Octokit;
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
    this.octokit = new Octokit({
      auth: accessToken || process.env.GITHUB_CLIENT_SECRET,
    });
  }

  // Extract agent name from branch name
  private extractAgentFromBranch(branchName: string): string | null {
    const patterns = [
      { pattern: /^devin\//, agent: 'Devin' },
      { pattern: /^cursor\//, agent: 'Cursor' },
      { pattern: /^[a-z0-9]+-codex\//, agent: 'Codex' },
    ];

    for (const { pattern, agent } of patterns) {
      if (pattern.test(branchName)) {
        return agent;
      }
    }
    return null;
  }

  // Convert GitHub PR to our format
  private formatPullRequest(pr: any, repo: string): PullRequest {
    const fileChanges: FileChange[] = [];
    const updateLogs: UpdateLog[] = [];

    // Add basic update log entries
    if (pr.created_at) {
      updateLogs.push({
        timestamp: pr.created_at,
        action: 'Opened pull request',
        user: pr.user?.login || 'unknown',
      });
    }

    if (pr.merged_at) {
      updateLogs.push({
        timestamp: pr.merged_at,
        action: 'Merged to ' + pr.base.ref,
        user: pr.merged_by?.login || 'unknown',
      });
    }

    if (pr.closed_at && !pr.merged_at) {
      updateLogs.push({
        timestamp: pr.closed_at,
        action: 'Closed without merging',
        user: pr.user?.login || 'unknown',
      });
    }

    // Determine status
    let status: 'draft' | 'open' | 'closed' | 'merged' = 'open';
    if (pr.draft) status = 'draft';
    else if (pr.merged) status = 'merged';
    else if (pr.state === 'closed') status = 'closed';
    else if (pr.state === 'open') status = 'open';

    const sourceAgent = this.extractAgentFromBranch(pr.head.ref);

    return {
      id: `pr-${repo}-${pr.number}`,
      number: pr.number,
      title: pr.title || '',
      branchName: pr.head.ref,
      baseBranch: pr.base.ref,
      githubUrl: pr.html_url,
      sourceAgent,
      status,
      description: pr.body || '',
      lastUpdated: pr.updated_at,
      created: pr.created_at,
      updateLogs,
      fileChanges,
      repository: repo,
      author: pr.user?.login || 'unknown',
      reviewers: pr.requested_reviewers?.map((r: any) => r.login) || [],
      labels: pr.labels?.map((l: any) => l.name) || [],
      comments: pr.comments || 0,
      commits: pr.commits || 0,
    };
  }

  // Fetch pull requests from a repository
  async fetchPullRequests(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<PullRequest[]> {
    try {
      const { data: pulls } = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        per_page: 100,
        sort: 'updated',
        direction: 'desc',
      });

      const formattedPRs = await Promise.all(
        pulls.map(async (pr) => {
          const formattedPR = this.formatPullRequest(pr, `${owner}/${repo}`);
          
          // Fetch file changes for each PR
          try {
            const { data: files } = await this.octokit.pulls.listFiles({
              owner,
              repo,
              pull_number: pr.number,
            });

            formattedPR.fileChanges = files.map((file: any) => ({
              filename: file.filename,
              additions: file.additions,
              deletions: file.deletions,
              status: file.status,
              patch: file.patch,
            }));
          } catch (error) {
            console.error(`Error fetching files for PR #${pr.number}:`, error);
          }

          // Fetch review comments and events for more detailed update logs
          try {
            const { data: timeline } = await this.octokit.issues.listEvents({
              owner,
              repo,
              issue_number: pr.number,
            });

            timeline.forEach((event: any) => {
              if (event.event && event.created_at) {
                formattedPR.updateLogs.push({
                  timestamp: event.created_at,
                  action: this.formatEventAction(event.event, event),
                  user: event.actor?.login || 'unknown',
                });
              }
            });

            // Sort update logs by timestamp
            formattedPR.updateLogs.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
          } catch (error) {
            console.error(`Error fetching timeline for PR #${pr.number}:`, error);
          }

          return formattedPR;
        })
      );

      return formattedPRs;
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw error;
    }
  }

  // Format event action for update logs
  private formatEventAction(event: string, data: any): string {
    const eventMap: { [key: string]: string } = {
      'closed': 'Closed pull request',
      'reopened': 'Reopened pull request',
      'renamed': 'Renamed pull request',
      'labeled': `Added label: ${data.label?.name || 'unknown'}`,
      'unlabeled': `Removed label: ${data.label?.name || 'unknown'}`,
      'review_requested': `Requested review from ${data.requested_reviewer?.login || 'user'}`,
      'review_request_removed': `Removed review request`,
      'assigned': `Assigned to ${data.assignee?.login || 'user'}`,
      'unassigned': `Unassigned from ${data.assignee?.login || 'user'}`,
      'milestoned': `Added to milestone: ${data.milestone?.title || 'unknown'}`,
      'demilestoned': `Removed from milestone`,
      'head_ref_force_pushed': 'Force pushed to branch',
      'ready_for_review': 'Marked as ready for review',
      'converted_to_draft': 'Converted to draft',
    };

    return eventMap[event] || `${event.replace(/_/g, ' ')}`;
  }

  // Fetch repositories for a user
  async fetchUserRepositories(username?: string): Promise<Repository[]> {
    try {
      const { data: repos } = username
        ? await this.octokit.repos.listForUser({ username, per_page: 100 })
        : await this.octokit.repos.listForAuthenticatedUser({ per_page: 100 });

      return repos.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        description: repo.description,
        defaultBranch: repo.default_branch,
        url: repo.html_url,
      }));
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  // Fetch issues from a repository
  async fetchIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all'): Promise<Issue[]> {
    try {
      const { data: issues } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 100,
      });

      return issues
        .filter((issue: any) => !issue.pull_request) // Filter out PRs
        .map((issue: any) => ({
          id: `issue-${owner}/${repo}-${issue.number}`,
          number: issue.number,
          title: issue.title,
          description: issue.body || '',
          state: issue.state as 'open' | 'closed',
          repository: `${owner}/${repo}`,
          pullRequests: [],
          created: issue.created_at,
          updated: issue.updated_at,
          author: issue.user?.login || 'unknown',
          labels: issue.labels?.map((l: any) => l.name) || [],
        }));
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  // Update PR status (limited to what's possible via API)
  async updatePullRequestStatus(owner: string, repo: string, prNumber: number, action: 'close' | 'reopen' | 'merge'): Promise<void> {
    try {
      switch (action) {
        case 'close':
          await this.octokit.pulls.update({
            owner,
            repo,
            pull_number: prNumber,
            state: 'closed',
          });
          break;
        case 'reopen':
          await this.octokit.pulls.update({
            owner,
            repo,
            pull_number: prNumber,
            state: 'open',
          });
          break;
        case 'merge':
          await this.octokit.pulls.merge({
            owner,
            repo,
            pull_number: prNumber,
          });
          break;
      }
    } catch (error) {
      console.error(`Error updating PR status:`, error);
      throw error;
    }
  }

  // Create a comment on a PR
  async createPullRequestComment(owner: string, repo: string, prNumber: number, body: string): Promise<void> {
    try {
      await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });
    } catch (error) {
      console.error(`Error creating PR comment:`, error);
      throw error;
    }
  }

  // Get authenticated user info
  async getAuthenticatedUser() {
    try {
      const { data: user } = await this.octokit.users.getAuthenticated();
      return user;
    } catch (error) {
      console.error('Error fetching authenticated user:', error);
      throw error;
    }
  }
}
