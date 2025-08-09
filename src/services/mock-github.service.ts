import { BaseGitHubService } from './github.service'
import { PullRequest, Issue, Repository, UpdateLog } from '@/types/github'

// Mock data for development
export class MockGitHubService extends BaseGitHubService {
  private mockPullRequests: PullRequest[] = [
    {
      id: 'pr1',
      branchName: 'devin/8924751033-implement-dark-mode',
      liveLink: 'https://preview.example.com/pr1',
      sshLink: 'ssh://vm1.example.com:22',
      model: 'Claude 3.5',
      sourceAgent: 'Devin',
      logs: 'https://logs.example.com/pr1',
      status: 'merged',
      description: 'Successfully implemented dark mode toggle with persistent user preferences. The implementation uses CSS variables for theme switching and localStorage for persistence.',
      lastUpdated: '2024-12-20T16:00:00Z',
      created: '2024-12-20T10:00:00Z',
      updateLogs: [
        { timestamp: '2024-12-20T16:00:00Z', action: 'Merged to main', user: 'admin' },
        { timestamp: '2024-12-20T15:30:00Z', action: 'Approved by reviewer', user: 'reviewer-1' },
        { timestamp: '2024-12-20T14:00:00Z', action: 'All tests passed', user: 'ci-bot' },
        { timestamp: '2024-12-20T10:00:00Z', action: 'Opened pull request', user: 'devin-bot' }
      ],
      fileChanges: [
        { filename: 'src/hooks/useDarkMode.ts', additions: 45, deletions: 0 },
        { filename: 'src/styles/themes.css', additions: 89, deletions: 12 },
        { filename: 'src/components/ThemeToggle.tsx', additions: 67, deletions: 0 }
      ]
    },
    {
      id: 'pr2',
      branchName: 'cursor/add-search-functionality-xyz789',
      liveLink: 'https://preview.example.com/pr2',
      sshLink: 'ssh://vm2.example.com:22',
      model: 'GPT-4',
      sourceAgent: 'Cursor',
      logs: 'https://logs.example.com/pr2',
      status: 'open',
      description: 'Adding search and filter functionality to quickly find PRs by status, agent, or file changes. Includes debounced search input and multi-select filters.',
      lastUpdated: '2024-12-21T09:00:00Z',
      created: '2024-12-21T08:00:00Z',
      updateLogs: [
        { timestamp: '2024-12-21T09:00:00Z', action: 'Updated search algorithm', user: 'cursor-agent' },
        { timestamp: '2024-12-21T08:30:00Z', action: 'Added tests', user: 'cursor-agent' },
        { timestamp: '2024-12-21T08:00:00Z', action: 'Opened pull request', user: 'cursor-agent' }
      ],
      fileChanges: [
        { filename: 'src/components/SearchBar.tsx', additions: 134, deletions: 0 },
        { filename: 'src/hooks/useSearch.ts', additions: 78, deletions: 0 },
        { filename: 'src/utils/filterUtils.ts', additions: 56, deletions: 0 },
        { filename: 'src/components/FilterPanel.tsx', additions: 92, deletions: 0 }
      ]
    },
    {
      id: 'pr3',
      branchName: '23ck3v-codex/fix-font-weight',
      liveLink: 'https://preview.example.com/pr3',
      githubUrl: 'https://github.com/example/repo/pull/3',
      model: 'GPT-4',
      sourceAgent: 'Codex',
      logs: 'https://logs.example.com/pr3',
      status: 'closed',
      description: 'Alternative approach using inline styles. This was closed in favor of the CSS variable approach.',
      lastUpdated: '2024-01-15T13:00:00Z',
      created: '2024-01-15T09:00:00Z',
      updateLogs: [
        { timestamp: '2024-01-15T13:00:00Z', action: 'Closed without merging', user: 'admin' },
        { timestamp: '2024-01-15T09:00:00Z', action: 'Opened pull request', user: 'codex-bot' }
      ],
      fileChanges: [
        { filename: 'src/components/Text.tsx', additions: 8, deletions: 15 },
        { filename: 'src/pages/index.tsx', additions: 3, deletions: 7 }
      ]
    },
    {
      id: 'pr4',
      branchName: 'devin/8924751033-update-navigation-menu',
      liveLink: 'https://preview.example.com/pr4',
      githubUrl: 'https://github.com/example/repo/pull/4',
      model: 'Claude 3.5',
      sourceAgent: 'Devin',
      logs: 'https://logs.example.com/pr4',
      status: 'open',
      description: 'Refactored navigation menu to use a more accessible pattern with proper ARIA labels and keyboard navigation support.',
      lastUpdated: '2024-01-15T16:00:00Z',
      created: '2024-01-14T14:00:00Z',
      updateLogs: [
        { timestamp: '2024-01-15T16:00:00Z', action: 'Resolved merge conflicts', user: 'devin-bot' },
        { timestamp: '2024-01-14T14:00:00Z', action: 'Opened pull request', user: 'devin-bot' }
      ],
      fileChanges: [
        { filename: 'src/components/Navigation.tsx', additions: 145, deletions: 89 },
        { filename: 'src/components/NavItem.tsx', additions: 67, deletions: 23 },
        { filename: 'src/hooks/useNavigation.ts', additions: 45, deletions: 0 },
        { filename: 'src/styles/navigation.css', additions: 78, deletions: 45 },
        { filename: 'src/utils/accessibility.ts', additions: 34, deletions: 12 }
      ]
    },
    {
      id: 'pr5',
      branchName: 'cursor/update-navigation-menu-xyz789',
      liveLink: 'https://preview.example.com/pr5',
      githubUrl: 'https://github.com/example/repo/pull/5',
      model: 'Claude 4.1',
      sourceAgent: 'Cursor',
      logs: 'https://logs.example.com/pr5',
      status: 'open',
      description: 'Navigation menu update with mobile-first responsive design. Includes hamburger menu for mobile viewports.',
      lastUpdated: '2024-01-15T14:00:00Z',
      created: '2024-01-14T16:00:00Z',
      updateLogs: [
        { timestamp: '2024-01-15T14:00:00Z', action: 'Updated based on review feedback', user: 'cursor-agent' },
        { timestamp: '2024-01-14T16:00:00Z', action: 'Opened pull request', user: 'cursor-agent' }
      ],
      fileChanges: [
        { filename: 'src/components/MobileNav.tsx', additions: 234, deletions: 0 },
        { filename: 'src/components/Hamburger.tsx', additions: 56, deletions: 0 },
        { filename: 'src/hooks/useMediaQuery.ts', additions: 28, deletions: 0 },
        { filename: 'src/styles/mobile.css', additions: 156, deletions: 23 }
      ]
    },
    {
      id: 'pr6',
      branchName: 'ab12cd-codex/update-navigation-menu',
      liveLink: 'https://preview.example.com/pr6',
      githubUrl: 'https://github.com/example/repo/pull/6',
      model: 'GPT-4',
      sourceAgent: 'Codex',
      logs: 'https://logs.example.com/pr6',
      status: 'merged',
      description: 'Successfully merged navigation improvements with animation transitions and hover states.',
      lastUpdated: '2024-01-15T12:00:00Z',
      created: '2024-01-14T10:00:00Z',
      updateLogs: [
        { timestamp: '2024-01-15T12:00:00Z', action: 'Merged to main', user: 'admin' },
        { timestamp: '2024-01-15T11:00:00Z', action: 'Approved by reviewer', user: 'reviewer-1' },
        { timestamp: '2024-01-14T10:00:00Z', action: 'Opened pull request', user: 'codex-bot' }
      ],
      fileChanges: [
        { filename: 'src/components/Navigation.tsx', additions: 123, deletions: 167 },
        { filename: 'src/animations/nav.ts', additions: 89, deletions: 0 },
        { filename: 'src/styles/animations.css', additions: 67, deletions: 12 }
      ]
    },
    {
      id: 'pr7',
      branchName: 'devin/5671234890-optimize-database-queries',
      liveLink: 'https://preview.example.com/pr7',
      githubUrl: 'https://github.com/example/repo/pull/7',
      model: null,
      sourceAgent: 'Devin',
      logs: 'https://logs.example.com/pr7',
      status: 'open',
      description: 'Optimized N+1 queries in the user dashboard. Added proper indexing and query batching.',
      lastUpdated: '2024-01-15T17:30:00Z',
      created: '2024-01-15T08:00:00Z',
      updateLogs: [
        { timestamp: '2024-01-15T17:30:00Z', action: 'Performance tests passed', user: 'ci-bot' },
        { timestamp: '2024-01-15T08:00:00Z', action: 'Opened pull request', user: 'devin-bot' }
      ],
      fileChanges: [
        { filename: 'src/api/queries.ts', additions: 234, deletions: 456 },
        { filename: 'src/db/indexes.sql', additions: 45, deletions: 0 },
        { filename: 'src/services/userService.ts', additions: 89, deletions: 123 },
        { filename: 'src/lib/queryBatcher.ts', additions: 156, deletions: 0 },
        { filename: 'src/hooks/useUser.ts', additions: 34, deletions: 67 },
        { filename: 'tests/performance.test.ts', additions: 89, deletions: 12 }
      ]
    },
    {
      id: 'pr8',
      branchName: 'cursor/scan-for-security-vulnerabilities-51c0',
      liveLink: 'https://preview.example.com/pr8',
      githubUrl: 'https://github.com/example/repo/pull/8',
      model: 'GPT-5',
      sourceAgent: 'Cursor',
      logs: 'https://logs.example.com/pr8',
      status: 'draft',
      description: 'Security audit implementation. Found and patched 3 critical XSS vulnerabilities. Still testing the fixes.',
      lastUpdated: '2024-01-15T18:00:00Z',
      created: '2024-01-15T07:00:00Z',
      updateLogs: [
        { timestamp: '2024-01-15T18:00:00Z', action: 'Security scan completed', user: 'security-bot' },
        { timestamp: '2024-01-15T07:00:00Z', action: 'Opened pull request', user: 'cursor-agent' }
      ],
      fileChanges: [
        { filename: 'src/utils/sanitize.ts', additions: 78, deletions: 23 },
        { filename: 'src/middleware/security.ts', additions: 145, deletions: 67 },
        { filename: 'src/validators/input.ts', additions: 89, deletions: 34 },
        { filename: 'package.json', additions: 3, deletions: 1 }
      ]
    },
    {
      id: 'pr9',
      branchName: '99zx88-codex/reduce-unnecessary-span-data',
      liveLink: 'https://preview.example.com/pr9',
      githubUrl: 'https://github.com/example/repo/pull/9',
      model: 'Claude 3.5',
      sourceAgent: 'Codex',
      logs: 'https://logs.example.com/pr9',
      status: 'open',
      description: 'Reduced DOM size by 40% by removing unnecessary wrapper elements and optimizing component structure.',
      lastUpdated: '2024-01-15T16:45:00Z',
      created: '2024-01-15T06:00:00Z',
      updateLogs: [
        { timestamp: '2024-01-15T16:45:00Z', action: 'Lighthouse score improved to 98', user: 'ci-bot' },
        { timestamp: '2024-01-15T06:00:00Z', action: 'Opened pull request', user: 'codex-bot' }
      ],
      fileChanges: [
        { filename: 'src/components/Layout.tsx', additions: 12, deletions: 89 },
        { filename: 'src/components/Card.tsx', additions: 5, deletions: 34 },
        { filename: 'src/components/List.tsx', additions: 8, deletions: 56 },
        { filename: 'src/components/Grid.tsx', additions: 3, deletions: 45 },
        { filename: 'src/utils/dom.ts', additions: 23, deletions: 78 },
        { filename: 'src/pages/dashboard.tsx', additions: 15, deletions: 123 },
        { filename: 'src/pages/profile.tsx', additions: 7, deletions: 67 }
      ]
    }
  ]

  async fetchPullRequests(): Promise<PullRequest[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    return [...this.mockPullRequests]
  }

  async fetchIssues(): Promise<Issue[]> {
    // Group PRs by extracted issue names to create issues
    const pullRequests = await this.fetchPullRequests()
    const issueMap = new Map<string, PullRequest[]>()
    
    pullRequests.forEach(pr => {
      const issueName = this.extractIssueName(pr.branchName, pr.sourceAgent)
      const existing = issueMap.get(issueName) || []
      existing.push({ ...pr, issueId: issueName })
      issueMap.set(issueName, existing)
    })
    
    return Array.from(issueMap.entries()).map(([issueName, prs], index) => ({
      id: String(index + 1),
      title: this.formatIssueName(issueName),
      pullRequests: prs.map(pr => ({ ...pr, issueId: String(index + 1) })),
      isExpanded: true
    }))
  }

  async fetchRepository(): Promise<Repository> {
    return {
      owner: 'example',
      name: 'repo',
      defaultBranch: 'main',
      issues: await this.fetchIssues(),
      pullRequests: await this.fetchPullRequests()
    }
  }

  async updatePullRequestStatus(prId: string, status: PullRequest['status']): Promise<PullRequest> {
    const prIndex = this.mockPullRequests.findIndex(pr => pr.id === prId)
    
    if (prIndex === -1) {
      throw new Error(`Pull request ${prId} not found`)
    }
    
    const pr = this.mockPullRequests[prIndex]
    
    // Don't allow changes to merged PRs
    if (pr.status === 'merged') {
      return pr
    }
    
    // Create update log entry
    const newUpdateLog: UpdateLog = {
      timestamp: new Date().toISOString(),
      action: `Status changed to ${status}`,
      user: 'user'
    }
    
    // Update the PR
    const updatedPR = {
      ...pr,
      status,
      lastUpdated: new Date().toISOString(),
      updateLogs: [newUpdateLog, ...pr.updateLogs]
    }
    
    this.mockPullRequests[prIndex] = updatedPR
    
    return updatedPR
  }

  async linkPullRequestToIssue(prId: string, issueId: string): Promise<void> {
    const prIndex = this.mockPullRequests.findIndex(pr => pr.id === prId)
    
    if (prIndex === -1) {
      throw new Error(`Pull request ${prId} not found`)
    }
    
    this.mockPullRequests[prIndex].issueId = issueId
  }

  // Helper methods
  private extractIssueName(branchName: string, agent: string | null): string {
    if (!agent) return 'unknown-issue'
    
    const parts = branchName.split('/')
    if (parts.length < 2) return 'unknown-issue'
    
    const branchPart = parts.slice(1).join('/')
    
    switch(agent.toLowerCase()) {
      case 'devin':
        // devin/<guid>-kebab-case-issue-name
        const devinMatch = branchPart.match(/^[a-z0-9]+-(.+)$/i)
        if (devinMatch) return devinMatch[1]
        break
        
      case 'cursor':
        // cursor/kebab-case-issue-name-<guid>
        const cursorMatch = branchPart.match(/^(.+)-[a-z0-9]+$/i)
        if (cursorMatch) return cursorMatch[1]
        break
        
      case 'codex':
        // <guid>-codex/kebab-case-issue-name
        const codexParts = branchName.split('/')
        if (codexParts.length >= 2) {
          return codexParts[codexParts.length - 1]
        }
        break
    }
    
    return branchPart || 'unknown-issue'
  }
  
  private formatIssueName(issueName: string): string {
    return issueName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}
