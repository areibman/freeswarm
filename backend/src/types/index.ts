export interface UpdateLog {
  timestamp: string;
  action: string;
  user: string;
}

export interface FileChange {
  filename: string;
  additions: number;
  deletions: number;
  status: string;
  patch?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  branchName: string;
  baseBranch: string;
  liveLink?: string;
  sshLink?: string;
  githubUrl: string;
  model?: string | null;
  sourceAgent?: string | null;
  logs?: string;
  issueId?: string;
  status: 'draft' | 'open' | 'closed' | 'merged';
  description: string;
  lastUpdated: string;
  created: string;
  updateLogs: UpdateLog[];
  fileChanges: FileChange[];
  repository: string;
  author: string;
  reviewers?: string[];
  labels?: string[];
  comments?: number;
  commits?: number;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  description: string;
  state: 'open' | 'closed';
  repository: string;
  pullRequests: PullRequest[];
  created: string;
  updated: string;
  author: string;
  labels?: string[];
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description?: string;
  defaultBranch: string;
  url: string;
  lastFetched?: string;
}

export interface User {
  id: string;
  githubId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  darkMode: boolean;
  repositories: string[];
  filters?: {
    status?: string[];
    agent?: string[];
    repository?: string[];
  };
  notifications: boolean;
}

export interface WebhookPayload {
  action: string;
  pull_request?: any;
  issue?: any;
  repository: any;
  sender: any;
}

export interface CacheEntry {
  key: string;
  data: any;
  expiresAt: Date;
}

export interface GitHubConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  privateKey?: string;
}