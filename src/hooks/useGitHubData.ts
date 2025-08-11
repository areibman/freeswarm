import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Types
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

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  description?: string;
  defaultBranch: string;
  url: string;
}

interface UseGitHubDataOptions {
  repositories?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  useWebSocket?: boolean;
  accessToken?: string;
}

export interface UseGitHubDataReturn {
  pullRequests: PullRequest[];
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updatePRStatus: (owner: string, repo: string, prNumber: number, action: 'close' | 'reopen' | 'merge') => Promise<void>;
  addComment: (owner: string, repo: string, prNumber: number, comment: string) => Promise<void>;
  launchPreview: (owner: string, repo: string, prNumber: number, branchName: string) => Promise<string>;
  connected: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function useGitHubData(options: UseGitHubDataOptions = {}): UseGitHubDataReturn {
  const {
    repositories = [],
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute
    useWebSocket = true,
    accessToken,
  } = options;

  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [repositoriesList, setRepositoriesList] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch pull requests from backend
  const fetchPullRequests = useCallback(async () => {
    if (repositories.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/pull-requests?repositories=${repositories.join(',')}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pull requests: ${response.statusText}`);
      }

      const data = await response.json();
      setPullRequests(data);
    } catch (err) {
      console.error('Error fetching pull requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pull requests');
      
      // Try to load cached data on error
      try {
        const cachedResponse = await fetch(
          `${API_BASE_URL}/api/pull-requests/cached?repositories=${repositories.join(',')}`,
          { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
        );
        
        if (cachedResponse.ok) {
          const cachedData = await cachedResponse.json();
          setPullRequests(cachedData);
          setError('Using cached data (offline mode)');
        }
      } catch (cacheErr) {
        console.error('Failed to load cached data:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  }, [repositories, accessToken]);

  // Fetch repositories list
  const fetchRepositories = useCallback(async () => {
    // Skip fetching if no repositories are configured
    if (repositories.length === 0) {
      return;
    }
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/repositories`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
      }

      const data = await response.json();
      setRepositoriesList(data);
    } catch (err) {
      console.error('Error fetching repositories:', err);
    }
  }, [accessToken, repositories.length]);

  // Update PR status
  const updatePRStatus = useCallback(async (
    owner: string,
    repo: string,
    prNumber: number,
    action: 'close' | 'reopen' | 'merge'
  ) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/repos/${owner}/${repo}/pull-requests/${prNumber}/status`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update PR status: ${response.statusText}`);
      }

      // Refresh data after update
      await fetchPullRequests();
    } catch (err) {
      console.error('Error updating PR status:', err);
      throw err;
    }
  }, [accessToken, fetchPullRequests]);

  // Add comment to PR
  const addComment = useCallback(async (
    owner: string,
    repo: string,
    prNumber: number,
    comment: string
  ) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/repos/${owner}/${repo}/pull-requests/${prNumber}/comments`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ comment }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }, [accessToken]);

  // Add: Launch Preview for a PR/branch
  const launchPreview = useCallback(async (
    owner: string,
    repo: string,
    prNumber: number,
    branchName: string
  ) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const response = await fetch(
      `${API_BASE_URL}/api/repos/${owner}/${repo}/pull-requests/${prNumber}/preview`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ branchName }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to launch preview: ${response.statusText}`);
    }

    const data = await response.json();
    const liveLink = data.liveLink as string;

    // Optimistically update local state for this PR only
    setPullRequests(prev => prev.map(pr => (
      pr.number === prNumber && pr.repository === `${owner}/${repo}`
        ? { ...pr, liveLink }
        : pr
    )));

    return liveLink;
  }, [accessToken]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!useWebSocket) return;

    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // Subscribe to repositories
      repositories.forEach(repo => {
        socket.emit('subscribe:repository', repo);
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Handle PR updates
    socket.on('pr:updated', (data: { prId: string; update: Partial<PullRequest> }) => {
      setPullRequests(prev => prev.map(pr => 
        pr.id === data.prId ? { ...pr, ...data.update } : pr
      ));
    });

    // Handle new PRs
    socket.on('pr:created', (data: { pullRequest: PullRequest }) => {
      setPullRequests(prev => [data.pullRequest, ...prev]);
    });

    // Handle PR deletion
    socket.on('pr:deleted', (data: { prId: string }) => {
      setPullRequests(prev => prev.filter(pr => pr.id !== data.prId));
    });

    // Handle webhook events
    socket.on('webhook:pr', (_data: unknown) => {
      // Refresh data on webhook events
      fetchPullRequests();
    });

    return () => {
      repositories.forEach(repo => {
        socket.emit('unsubscribe:repository', repo);
      });
      socket.disconnect();
    };
  }, [repositories, useWebSocket, fetchPullRequests]);

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    refreshTimerRef.current = setInterval(() => {
      fetchPullRequests();
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchPullRequests]);

  // Initial fetch
  useEffect(() => {
    fetchPullRequests();
    // Only fetch repositories if we have repositories configured (not in mock mode)
    if (repositories.length > 0) {
      fetchRepositories();
    }
  }, [fetchPullRequests, fetchRepositories, repositories.length]);

  return {
    pullRequests,
    repositories: repositoriesList,
    loading,
    error,
    refresh: fetchPullRequests,
    updatePRStatus,
    addComment,
    launchPreview,
    connected,
  };
}