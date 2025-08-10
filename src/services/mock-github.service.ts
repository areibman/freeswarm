import { BaseGitHubService } from './github.service'
import { PullRequest, Issue, Repository, UpdateLog } from '@/types/github'

// Mock pull requests data
export const mockPullRequestsData: PullRequest[] = [
    {
      id: 'pr1',
      number: 1,
      title: 'Add 3D soundboard effects to Tic Tac Toe',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'codex/enhance-game-with-3d-soundboard-features',
      liveLink: '',
      sshLink: '',
      model: 'ChatGPT task',
      sourceAgent: 'Codex',
      logs: '',
      issueId: 'enhance-game-with-3d-soundboard-features',
      status: 'open',
      description: 'Integrate Web Audio API to play positional tones per grid cell, apply 3D perspective styling to the board for a soundboard feel',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 121, deletions: 52 }]
    },
    {
      id: 'pr2',
      number: 2,
      title: 'Add 3D soundboard effects to Tic Tac Toe',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'vezyl6-codex/enhance-game-with-3d-soundboard-features',
      liveLink: '',
      sshLink: '',
      model: 'ChatGPT task',
      sourceAgent: 'Codex',
      logs: '',
      issueId: 'enhance-game-with-3d-soundboard-features',
      status: 'open',
      description: 'Add Web Audio tone generation with 3D panning for each cell, tilt game board in 3D based on mouse movement, trigger spatial sounds for player and CPU moves',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 110, deletions: 52 }]
    },
    {
      id: 'pr3',
      number: 3,
      title: 'feat: add 3d soundboard audio',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'xtokf9-codex/enhance-game-with-3d-soundboard-features',
      liveLink: '',
      sshLink: '',
      model: 'ChatGPT task',
      sourceAgent: 'Codex',
      logs: '',
      issueId: 'enhance-game-with-3d-soundboard-features',
      status: 'open',
      description: 'Add spatial soundboard effect using Web Audio API and panner nodes, trigger move sounds for both player and CPU, update header/footer to reflect 3D soundboard theme',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 54, deletions: 16 }]
    },
    {
      id: 'pr4',
      number: 4,
      title: 'Add 3D soundboard effects to Tic Tac Toe',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'f5yg8k-codex/enhance-game-with-3d-soundboard-features',
      liveLink: '',
      sshLink: '',
      model: 'ChatGPT task',
      sourceAgent: 'Codex',
      logs: '',
      issueId: 'enhance-game-with-3d-soundboard-features',
      status: 'open',
      description: 'Add simple sine-tone audio for each move, give the board a 3D soundboard style with perspective and press animations',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 38, deletions: 19 }]
    },
    {
      id: 'pr5',
      number: 5,
      title: 'Mobile: comprehensive responsive optimization',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'devin-ai-integration[bot]' },
      branchName: 'devin/1754773763-mobile-optimization',
      liveLink: '',
      sshLink: '',
      model: '',
      sourceAgent: 'Devin AI',
      logs: '',
      issueId: 'mobile-optimization',
      status: 'open',
      description: 'Comprehensive mobile optimization with responsive board sizing, scalable grid lines, mobile-friendly typography, touch improvements, safe area handling, and accessibility enhancements',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'devin-ai-integration[bot]' }],
      fileChanges: [{ filename: '', additions: 87, deletions: 75 }]
    },
    {
      id: 'pr6',
      number: 6,
      title: 'Optimize website for mobile',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'cursor/optimize-website-for-mobile-48c2',
      liveLink: '',
      sshLink: '',
      model: '',
      sourceAgent: 'Cursor Agent',
      logs: '',
      issueId: 'optimize-website-for-mobile',
      status: 'open',
      description: 'Enhance mobile responsiveness and provide an app-like experience. Adds comprehensive mobile meta tags and adjusts game-board cell and mark font sizes to be fully responsive',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 6, deletions: 3 }]
    },
    {
      id: 'pr7',
      number: 7,
      title: 'Optimize website for mobile',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'cursor/optimize-website-for-mobile-301c',
      liveLink: '',
      sshLink: '',
      model: '',
      sourceAgent: 'Cursor Agent',
      logs: '',
      issueId: 'optimize-website-for-mobile',
      status: 'open',
      description: 'Enhance mobile user experience by implementing responsive layouts, touch optimizations, and safe-area support',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 38, deletions: 6 }]
    },
    {
      id: 'pr8',
      number: 8,
      title: 'Optimize website for mobile',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'cursor/optimize-website-for-mobile-94dd',
      liveLink: '',
      sshLink: '',
      model: '',
      sourceAgent: 'Cursor Agent',
      logs: '',
      issueId: 'optimize-website-for-mobile',
      status: 'open',
      description: 'Implement comprehensive mobile optimizations for a hyper-responsive and touch-friendly experience',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 160, deletions: 48 }]
    },
    {
      id: 'pr9',
      number: 9,
      title: 'Optimize website for mobile',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'cursor/optimize-website-for-mobile-fb32',
      liveLink: '',
      sshLink: '',
      model: '',
      sourceAgent: 'Cursor Agent',
      logs: '',
      issueId: 'optimize-website-for-mobile',
      status: 'open',
      description: 'Hyper-mobile optimize the Tic Tac Toe website by implementing PWA features, responsive design, touch interactions, and performance enhancements',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 788, deletions: 127 }]
    },
    {
      id: 'pr10',
      number: 10,
      title: 'Optimize website for mobile',
      repository: { owner: 'areibman', name: 'freeswarm-sample-app' },
      author: { login: 'areibman' },
      branchName: 'cursor/optimize-website-for-mobile-9718',
      liveLink: '',
      sshLink: '',
      model: '',
      sourceAgent: 'Cursor Agent',
      logs: '',
      issueId: 'optimize-website-for-mobile',
      status: 'open',
      description: 'Hyper-mobile optimized the Tic Tac Toe website to provide a console-quality gaming experience on mobile devices',
      lastUpdated: new Date().toISOString(),
      created: new Date().toISOString(),
      updateLogs: [{ timestamp: new Date().toISOString(), action: 'Opened pull request', user: 'areibman' }],
      fileChanges: [{ filename: '', additions: 592, deletions: 172 }]
    }
]

// Mock data for development
export class MockGitHubService extends BaseGitHubService {
  private mockPullRequests: PullRequest[] = [...mockPullRequestsData]

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
      const issueName = this.extractIssueName(pr.branchName, pr.sourceAgent || null)
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

  async deletePullRequests(prIds: string[]): Promise<void> {
    // Filter out the PRs with the given IDs
    this.mockPullRequests = this.mockPullRequests.filter(pr => !prIds.includes(pr.id))
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
