// GitHub-related type definitions
export interface UpdateLog {
  timestamp: string
  action: string
  user: string
}

export interface FileChange {
  filename: string
  additions: number
  deletions: number
}

export type PullRequestStatus = 'draft' | 'open' | 'closed' | 'merged'

export interface PullRequest {
  id: string
  branchName: string
  liveLink?: string
  sshLink?: string
  githubUrl?: string
  model?: string | null
  sourceAgent?: string | null
  logs?: string
  issueId?: string
  status: PullRequestStatus
  description: string
  lastUpdated: string
  created: string
  updateLogs: UpdateLog[]
  fileChanges: FileChange[]
  // GitHub API specific fields
  number?: number
  title?: string
  baseBranch?: string
  author?: string | {
    login: string
    avatarUrl?: string
  }
  repository?: string | {
    owner: string
    name: string
  }
  reviewers?: string[]
  labels?: string[]
  comments?: number
  commits?: number
}

export interface Issue {
  id: string
  title: string
  pullRequests: PullRequest[]
  isExpanded?: boolean
  // GitHub API specific fields (for future integration)
  number?: number
  state?: 'open' | 'closed'
  labels?: string[]
  assignees?: string[]
  repository?: {
    owner: string
    name: string
  }
}

export interface Repository {
  owner: string
  name: string
  defaultBranch: string
  issues?: Issue[]
  pullRequests?: PullRequest[]
}

// Agent-specific types
export type AgentType = 'Devin' | 'Cursor' | 'Codex' | string

export interface AgentConfig {
  name: AgentType
  branchPattern: RegExp
  extractIssueName: (branchName: string) => string
}
