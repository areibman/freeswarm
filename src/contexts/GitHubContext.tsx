"use client"

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react'
import { GitHubService } from '@/services/github.service'
import { MockGitHubService, mockPullRequestsData } from '@/services/mock-github.service'
import { GitHubAPIService } from '@/services/github.service'
import { useGitHubData, UseGitHubDataReturn } from '@/hooks/useGitHubData'
import { Issue, PullRequest } from '@/types/github'

export interface GitHubConfig {
  mode: 'mock' | 'api'
  apiConfig?: {
    baseUrl?: string
    token?: string
    owner: string
    repo: string
  }
  autoRefresh?: boolean
  refreshInterval?: number
}

interface GitHubContextValue {
  // Original properties from useGitHubData
  pullRequests: PullRequest[]
  repositories: UseGitHubDataReturn['repositories']
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  updatePRStatus: UseGitHubDataReturn['updatePRStatus']
  addComment: UseGitHubDataReturn['addComment']
  connected: boolean
  
  // Computed/mapped properties for compatibility
  issues: Issue[]
  updatePullRequestStatus: (prId: string, status: PullRequest['status']) => Promise<void>
  deletePullRequests: (prIds: string[]) => Promise<void>
  refetch: () => Promise<void>
  
  // Context-specific properties
  config: GitHubConfig
  service: GitHubService
  selectedRepositories: string[]
  reloadSelectedRepositories: () => Promise<void>
}

const GitHubContext = createContext<GitHubContextValue | undefined>(undefined)

export interface GitHubProviderProps {
  children: ReactNode
  config?: GitHubConfig
}

export function GitHubProvider({ 
  children, 
  config = { mode: 'mock' } 
}: GitHubProviderProps) {
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([])

  // Create the appropriate service based on config
  const service = React.useMemo(() => {
    if (config.mode === 'api' && config.apiConfig) {
      return new GitHubAPIService(config.apiConfig)
    }
    return new MockGitHubService()
  }, [config.mode, config.apiConfig])
  
  // Load selected repositories from backend session
  const reloadSelectedRepositories = useCallback(async () => {
    if (config.mode !== 'api') return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/connected-repositories`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedRepositories(data.repositories || [])
      } else {
        setSelectedRepositories([])
      }
    } catch {
      setSelectedRepositories([])
    }
  }, [config.mode])

  useEffect(() => {
    reloadSelectedRepositories()
  }, [reloadSelectedRepositories])
  
  // State for mock mode - initialize with data immediately if in mock mode
  const [mockPullRequests, setMockPullRequests] = useState<PullRequest[]>(
    config.mode === 'mock' ? mockPullRequestsData : []
  )
  const [mockLoading, setMockLoading] = useState(false)
  const [mockError, setMockError] = useState<string | null>(null)
  
  const fetchMockData = useCallback(async () => {
    try {
      setMockLoading(true)
      setMockError(null)
      const mockService = service as MockGitHubService
      const pullRequests = await mockService.fetchPullRequests()
      setMockPullRequests(pullRequests)
    } catch (err) {
      setMockError(err instanceof Error ? err.message : 'Failed to load mock data')
    } finally {
      setMockLoading(false)
    }
  }, [service])
  
  useEffect(() => {
    // Mock data is loaded directly via initial state
  }, [])
  
  // Use the GitHub data hook (repositories come from user selection when in api mode)
  const githubData = useGitHubData({
    repositories: config.mode === 'api' ? selectedRepositories : [],
    autoRefresh: config.mode === 'api' && config.autoRefresh,
    refreshInterval: config.refreshInterval,
    useWebSocket: config.mode === 'api'
  })
  
  const pullRequests: PullRequest[] = config.mode === 'mock' 
    ? mockPullRequests 
    : githubData.pullRequests as PullRequest[]
  const loading = config.mode === 'mock' ? mockLoading : githubData.loading
  const error = config.mode === 'mock' ? mockError : githubData.error
  const refresh = config.mode === 'mock' ? fetchMockData : githubData.refresh
  const updatePRStatus = config.mode === 'mock' 
    ? async (owner: string, repo: string, prNumber: number, action: 'close' | 'reopen' | 'merge') => {
        const pr = mockPullRequests.find(p => p.number === prNumber)
        if (pr) {
          let newStatus: PullRequest['status']
          switch (action) {
            case 'close': newStatus = 'closed'; break
            case 'merge': newStatus = 'merged'; break
            case 'reopen': newStatus = 'open'; break
          }
          const mockService = service as MockGitHubService
          const updatedPR = await mockService.updatePullRequestStatus(pr.id, newStatus)
          setMockPullRequests(prev => prev.map(p => p.id === pr.id ? updatedPR : p))
        }
      }
    : githubData.updatePRStatus
  
  const issues = useMemo(() => {
    const issueMap = new Map<string, Issue>()
    
    pullRequests.forEach(pr => {
      const issueId = pr.issueId || 'no-issue'
      const issueTitle = pr.title || `Issue ${issueId}`
      
      if (!issueMap.has(issueId)) {
        issueMap.set(issueId, {
          id: issueId,
          title: issueTitle,
          pullRequests: []
        })
      }
      
      const issue = issueMap.get(issueId)!
      issue.pullRequests.push(pr)
    })
    
    return Array.from(issueMap.values())
  }, [githubData.pullRequests])
  
  const updatePullRequestStatus = useMemo(() => async (prId: string, status: PullRequest['status']) => {
    if (config.mode === 'mock') {
      const mockService = service as MockGitHubService
      const updatedPR = await mockService.updatePullRequestStatus(prId, status)
      setMockPullRequests(prev => prev.map(p => p.id === prId ? updatedPR : p))
    } else {
      const pr = pullRequests.find(p => p.id === prId)
      if (!pr || !pr.repository || !pr.number) {
        throw new Error('Pull request not found or missing required fields')
      }
      
      let owner: string, repo: string
      if (typeof pr.repository === 'string') {
        [owner, repo] = pr.repository.split('/')
      } else {
        owner = pr.repository.owner
        repo = pr.repository.name
      }
      
      let action: 'close' | 'reopen' | 'merge'
      switch (status) {
        case 'closed':
          action = 'close'
          break
        case 'merged':
          action = 'merge'
          break
        case 'open':
        case 'draft':
          action = 'reopen'
          break
        default:
          throw new Error(`Invalid status: ${status}`)
      }
      
      await updatePRStatus(owner, repo, pr.number, action)
    }
  }, [config.mode, service, pullRequests, updatePRStatus])
  
  const deletePullRequests = useMemo(() => async (prIds: string[]) => {
    if (config.mode === 'mock') {
      const mockService = service as MockGitHubService
      await mockService.deletePullRequests(prIds)
      setMockPullRequests(prev => prev.filter(pr => !prIds.includes(pr.id)))
    } else {
      await service.deletePullRequests(prIds)
      await refresh()
    }
  }, [config.mode, service, refresh])
  
  const value: GitHubContextValue = {
    pullRequests,
    repositories: config.mode === 'mock' ? [] : githubData.repositories,
    loading,
    error: error ? new Error(error) : null,
    refresh,
    updatePRStatus,
    addComment: config.mode === 'mock' ? async () => {} : githubData.addComment,
    connected: config.mode === 'mock' ? false : githubData.connected,
    
    issues,
    updatePullRequestStatus,
    deletePullRequests,
    refetch: refresh,
    
    config,
    service,
    selectedRepositories,
    reloadSelectedRepositories,
  }

  return (
    <GitHubContext.Provider value={value}>
      {children}
    </GitHubContext.Provider>
  )
}

export function useGitHub() {
  const context = useContext(GitHubContext)
  if (context === undefined) {
    throw new Error('useGitHub must be used within a GitHubProvider')
  }
  return context
}
