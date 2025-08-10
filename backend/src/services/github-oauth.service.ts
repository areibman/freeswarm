import axios from 'axios';
import { Octokit } from '@octokit/rest';

export class GitHubOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID!;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET!;
    this.redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/github/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth credentials not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your environment variables.');
    }
  }

  /**
   * Get GitHub OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo user:email read:org',
      state: this.generateState(),
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string; scope: string }> {
    try {
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error_description || 'Failed to exchange code for token');
      }

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to authenticate with GitHub');
    }
  }

  /**
   * Get user data from GitHub
   */
  async getUserData(accessToken: string): Promise<any> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      const { data: user } = await octokit.users.getAuthenticated();
      
      // Get primary email if not public
      if (!user.email) {
        try {
          const { data: emails } = await octokit.users.listEmailsForAuthenticatedUser();
          const primaryEmail = emails.find(email => email.primary);
          if (primaryEmail) {
            user.email = primaryEmail.email;
          }
        } catch (error) {
          console.warn('Could not fetch user emails:', error);
        }
      }

      return user;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error('Failed to fetch user data from GitHub');
    }
  }

  /**
   * Verify user has access to a repository
   */
  async verifyRepoAccess(accessToken: string, owner: string, repo: string): Promise<boolean> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      await octokit.repos.get({
        owner,
        repo,
      });

      return true;
    } catch (error) {
      if (error.status === 404 || error.status === 403) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get user's repositories
   */
  async getUserRepositories(accessToken: string): Promise<any[]> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        visibility: 'all',
        per_page: 100,
        sort: 'updated',
      });

      return repos;
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      throw new Error('Failed to fetch user repositories');
    }
  }

  /**
   * Generate a random state for OAuth flow
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}