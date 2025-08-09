import { PullRequest, Issue, Repository } from '@/types/github'

// GitHub API response types
interface GitHubUser {
  login: string
  avatar_url: string
}

interface GitHubRepo {
  owner: GitHubUser
  name: string
  default_branch: string
}

interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  draft: boolean
  merged: boolean
  html_url: string
  created_at: string
  updated_at: string
  user: GitHubUser
  head: {
    ref: string
  }
  base: {
    repo: GitHubRepo
  }
}

interface GitHubIssue {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  labels: Array<{ name: string }>
  assignees: GitHubUser[]
  pull_request?: unknown
  repository?: GitHubRepo
}

interface GitHubRepository {
  owner: GitHubUser
  name: string
  default_branch: string
}

export interface GitHubServiceConfig {
  baseUrl?: string
  token?: string
  owner?: string
  repo?: string
}

export interface GitHubService {
  fetchPullRequests(): Promise<PullRequest[]>
  fetchIssues(): Promise<Issue[]>
  fetchRepository(): Promise<Repository>
  updatePullRequestStatus(prId: string, status: PullRequest['status']): Promise<PullRequest>
  linkPullRequestToIssue(prId: string, issueId: string): Promise<void>
}

// Base service class that can be extended for real GitHub API
export class BaseGitHubService implements GitHubService {
  protected config: GitHubServiceConfig

  constructor(config: GitHubServiceConfig = {}) {
    this.config = config
  }

  async fetchPullRequests(): Promise<PullRequest[]> {
    // To be implemented by subclasses
    throw new Error('fetchPullRequests not implemented')
  }

  async fetchIssues(): Promise<Issue[]> {
    // To be implemented by subclasses
    throw new Error('fetchIssues not implemented')
  }

  async fetchRepository(): Promise<Repository> {
    // To be implemented by subclasses
    throw new Error('fetchRepository not implemented')
  }

  async updatePullRequestStatus(prId: string, status: PullRequest['status']): Promise<PullRequest> {
    // To be implemented by subclasses
    throw new Error('updatePullRequestStatus not implemented')
  }

  async linkPullRequestToIssue(prId: string, issueId: string): Promise<void> {
    // To be implemented by subclasses
    throw new Error('linkPullRequestToIssue not implemented')
  }
}

// Real GitHub API implementation (to be implemented later)
export class GitHubAPIService extends BaseGitHubService {
  private headers: HeadersInit

  constructor(config: GitHubServiceConfig) {
    super(config)
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      ...(config.token && { 'Authorization': `Bearer ${config.token}` })
    }
  }

  async fetchPullRequests(): Promise<PullRequest[]> {
    if (!this.config.owner || !this.config.repo) {
      throw new Error('Repository owner and name required')
    }

    const url = `${this.config.baseUrl || 'https://api.github.com'}/repos/${this.config.owner}/${this.config.repo}/pulls?state=all`
    const response = await fetch(url, { headers: this.headers })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pull requests: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Transform GitHub API response to our PullRequest type
    return data.map((pr: GitHubPullRequest) => this.transformPullRequest(pr))
  }

  async fetchIssues(): Promise<Issue[]> {
    if (!this.config.owner || !this.config.repo) {
      throw new Error('Repository owner and name required')
    }

    const url = `${this.config.baseUrl || 'https://api.github.com'}/repos/${this.config.owner}/${this.config.repo}/issues?state=all`
    const response = await fetch(url, { headers: this.headers })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch issues: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Transform GitHub API response to our Issue type
    return data
      .filter((issue: GitHubIssue) => !issue.pull_request) // Filter out PRs from issues endpoint
      .map((issue: GitHubIssue) => this.transformIssue(issue))
  }

  async fetchRepository(): Promise<Repository> {
    if (!this.config.owner || !this.config.repo) {
      throw new Error('Repository owner and name required')
    }

    const url = `${this.config.baseUrl || 'https://api.github.com'}/repos/${this.config.owner}/${this.config.repo}`
    const response = await fetch(url, { headers: this.headers })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      owner: data.owner.login,
      name: data.name,
      defaultBranch: data.default_branch
    }
  }

  async updatePullRequestStatus(prId: string, status: PullRequest['status']): Promise<PullRequest> {
    // GitHub API doesn't directly support our custom statuses
    // This would need to be implemented using labels or a custom backend
    console.warn('updatePullRequestStatus: Custom implementation needed')
    throw new Error('Not implemented for direct GitHub API')
  }

  async linkPullRequestToIssue(prId: string, issueId: string): Promise<void> {
    // This would typically be done through PR body or comments
    console.warn('linkPullRequestToIssue: Custom implementation needed')
    throw new Error('Not implemented for direct GitHub API')
  }

  private transformPullRequest(githubPR: GitHubPullRequest): PullRequest {
    // Transform GitHub API PR to our PullRequest type
    return {
      id: githubPR.id.toString(),
      number: githubPR.number,
      title: githubPR.title,
      branchName: githubPR.head.ref,
      githubUrl: githubPR.html_url,
      status: this.mapGitHubState(githubPR.state, githubPR.draft, githubPR.merged),
      description: githubPR.body || '',
      lastUpdated: githubPR.updated_at,
      created: githubPR.created_at,
      model: null, // Would need custom logic to extract from PR body or labels
      sourceAgent: null, // Would need custom logic to extract from branch name or labels
      logs: '', // Would need custom implementation
      updateLogs: [], // Would need to fetch from timeline API
      fileChanges: [], // Would need to fetch from files API
      author: {
        login: githubPR.user.login,
        avatarUrl: githubPR.user.avatar_url
      },
      repository: {
        owner: githubPR.base.repo.owner.login,
        name: githubPR.base.repo.name
      }
    }
  }

  private transformIssue(githubIssue: GitHubIssue): Issue {
    // Transform GitHub API issue to our Issue type
    return {
      id: githubIssue.id.toString(),
      number: githubIssue.number,
      title: githubIssue.title,
      state: githubIssue.state,
      labels: githubIssue.labels.map((label) => label.name),
      assignees: githubIssue.assignees.map((assignee) => assignee.login),
      pullRequests: [], // Would need to be linked separately
      repository: githubIssue.repository ? {
        owner: githubIssue.repository.owner.login,
        name: githubIssue.repository.name
      } : undefined
    }
  }

  private mapGitHubState(state: string, draft: boolean, merged: boolean): PullRequest['status'] {
    if (merged) return 'merged'
    if (draft) return 'draft'
    if (state === 'open') return 'open'
    if (state === 'closed') return 'closed'
    return 'open'
  }
}
