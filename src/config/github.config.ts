import { GitHubConfig } from '@/contexts/GitHubContext'

/**
 * GitHub configuration for the PR Manager
 * 
 * To connect to a real GitHub repository:
 * 1. Set mode to 'api'
 * 2. Create a GitHub personal access token with repo scope
 * 3. Add the token to your environment variables as NEXT_PUBLIC_GITHUB_TOKEN
 * 4. Update the owner and repo fields with your repository details
 * 
 * For GitHub Enterprise:
 * - Set baseUrl to your GitHub Enterprise API endpoint
 */
export const githubConfig: GitHubConfig = {
  // Data source mode - defaulting to 'api' for OAuth flow
  mode: (process.env.NEXT_PUBLIC_GITHUB_MODE as 'mock' | 'api') || 'api',
  
  // API configuration (used when mode is 'api')
  apiConfig: {
    baseUrl: process.env.NEXT_PUBLIC_GITHUB_API_URL || 'https://api.github.com',
    token: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
    owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'your-org',
    repo: process.env.NEXT_PUBLIC_GITHUB_REPO || 'your-repo'
  },
  
  // Auto-refresh settings
  autoRefresh: process.env.NEXT_PUBLIC_AUTO_REFRESH === 'true',
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '60000', 10)
}

/**
 * Agent configuration for branch name parsing
 */
export const agentPatterns = {
  devin: {
    name: 'Devin',
    pattern: /^devin\/([a-z0-9]+)-(.+)$/i,
    extractIssue: (match: RegExpMatchArray) => match[2]
  },
  cursor: {
    name: 'Cursor',
    pattern: /^cursor\/(.+)-([a-z0-9]+)$/i,
    extractIssue: (match: RegExpMatchArray) => match[1]
  },
  codex: {
    name: 'Codex',
    pattern: /^([a-z0-9]+)-codex\/(.+)$/i,
    extractIssue: (match: RegExpMatchArray) => match[2]
  }
}

/**
 * Example environment variables to add to your .env.local file:
 * 
 * # GitHub Configuration
 * NEXT_PUBLIC_GITHUB_MODE=api
 * NEXT_PUBLIC_GITHUB_TOKEN=your_github_personal_access_token
 * NEXT_PUBLIC_GITHUB_OWNER=your-github-org
 * NEXT_PUBLIC_GITHUB_REPO=your-repo-name
 * NEXT_PUBLIC_GITHUB_API_URL=https://api.github.com
 * NEXT_PUBLIC_AUTO_REFRESH=false
 * NEXT_PUBLIC_REFRESH_INTERVAL=60000
 */
