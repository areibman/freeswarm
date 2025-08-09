# GitHub Integration Guide

This guide explains how to connect the PR Manager to your GitHub repository.

## Architecture Overview

The app is now properly componentized with the following structure:

```
src/
├── types/github.ts         # Type definitions for GitHub data
├── services/               # Service layer for data fetching
│   ├── github.service.ts   # Base service and API implementation
│   └── mock-github.service.ts # Mock data for development
├── contexts/               # React contexts for data management
│   └── GitHubContext.tsx   # GitHub data provider
├── hooks/                  # Custom React hooks
│   └── useGitHubData.ts    # Hook for fetching and managing GitHub data
├── components/             # Reusable UI components
│   ├── PRManager.tsx       # Main PR manager component
│   ├── IssueCard.tsx       # Issue display component
│   └── PullRequestCard.tsx # Pull request display component
├── utils/                  # Utility functions
│   └── github.utils.ts     # GitHub-related utilities
└── config/                 # Configuration files
    └── github.config.ts     # GitHub configuration
```

## Quick Start

### 1. Development Mode (Mock Data)

By default, the app runs with mock data. No configuration needed:

```bash
npm run dev
```

### 2. Production Mode (Real GitHub Data)

To connect to a real GitHub repository:

#### Step 1: Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" (classic)
3. Give it a descriptive name (e.g., "PR Manager")
4. Select scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories only)
5. Generate and copy the token

#### Step 2: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# GitHub Configuration
NEXT_PUBLIC_GITHUB_MODE=api
NEXT_PUBLIC_GITHUB_TOKEN=your_github_personal_access_token_here
NEXT_PUBLIC_GITHUB_OWNER=your-github-username-or-org
NEXT_PUBLIC_GITHUB_REPO=your-repository-name

# Optional: GitHub Enterprise
# NEXT_PUBLIC_GITHUB_API_URL=https://your-github-enterprise.com/api/v3

# Optional: Auto-refresh
# NEXT_PUBLIC_AUTO_REFRESH=true
# NEXT_PUBLIC_REFRESH_INTERVAL=60000
```

#### Step 3: Run the Application

```bash
npm run dev
```

## Data Flow

1. **GitHubProvider** - Wraps the app and provides GitHub data context
2. **GitHubService** - Handles API calls to GitHub (or returns mock data)
3. **useGitHubData Hook** - Manages data fetching, caching, and updates
4. **Components** - Display data and handle user interactions

## Switching Between Mock and Real Data

You can easily switch between mock and real data by changing the `NEXT_PUBLIC_GITHUB_MODE` environment variable:

- `mock` - Uses mock data (default)
- `api` - Uses real GitHub API

## Customizing Agent Detection

The app automatically detects which agent created a PR based on branch naming conventions. You can customize this in `src/config/github.config.ts`:

```typescript
export const agentPatterns = {
  devin: {
    name: 'Devin',
    pattern: /^devin\/([a-z0-9]+)-(.+)$/i,
    extractIssue: (match: RegExpMatchArray) => match[2]
  },
  // Add more agent patterns here
}
```

## Extending the Service

To add custom data sources or modify the GitHub integration:

1. Extend `BaseGitHubService` in `src/services/github.service.ts`
2. Implement the required methods
3. Update the service selection logic in `GitHubProvider`

Example:

```typescript
// src/services/custom-github.service.ts
import { BaseGitHubService } from './github.service'

export class CustomGitHubService extends BaseGitHubService {
  async fetchPullRequests() {
    // Your custom implementation
  }
  
  async fetchIssues() {
    // Your custom implementation
  }
}
```

## API Methods

The GitHub service provides these methods:

- `fetchPullRequests()` - Get all pull requests
- `fetchIssues()` - Get all issues
- `fetchRepository()` - Get repository information
- `updatePullRequestStatus(prId, status)` - Update PR status
- `linkPullRequestToIssue(prId, issueId)` - Link PR to issue

## Component Props

### PRManager
Main component that orchestrates the PR management UI.

### IssueCard
Props:
- `issue` - Issue data
- `isExpanded` - Whether the issue is expanded
- `selectedPRs` - Set of selected PR IDs
- Various event handlers

### PullRequestCard
Props:
- `pullRequest` - PR data
- `isSelected` - Selection state
- Various event handlers

## Troubleshooting

### Token Issues
- Ensure your token has the correct scopes
- Check token expiration
- Verify token is correctly set in `.env.local`

### API Rate Limiting
GitHub API has rate limits:
- Unauthenticated: 60 requests/hour
- Authenticated: 5,000 requests/hour

### CORS Issues
If running locally and getting CORS errors:
- Ensure you're using the correct API URL
- Consider using a proxy for development

## Future Enhancements

The architecture is designed to easily support:
- Webhook integration for real-time updates
- Multiple repository support
- Advanced filtering and search
- Batch operations
- Caching and offline support
- GraphQL API integration
