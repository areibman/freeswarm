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
  
  // Deployment functionality
  deployPullRequest: (prId: string) => Promise<{ success: boolean; liveLink?: string; error?: string }>
  stopDeployment: (prId: string) => Promise<{ success: boolean }>
  
  // Context-specific properties
  config: GitHubConfig
  service: GitHubService
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
  // Create the appropriate service based on config
  const service = React.useMemo(() => {
    if (config.mode === 'api' && config.apiConfig) {
      return new GitHubAPIService(config.apiConfig)
    }
    return new MockGitHubService()
  }, [config.mode, config.apiConfig])
  
  // State for mock mode - initialize with data immediately if in mock mode
  const [mockPullRequests, setMockPullRequests] = useState<PullRequest[]>(
    config.mode === 'mock' ? mockPullRequestsData : []
  )
  const [mockLoading, setMockLoading] = useState(false) // Start with false since we have data
  const [mockError, setMockError] = useState<string | null>(null)
  
  // Fetch mock data
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
  
  // No-op effect for mock mode (data is already loaded via initial state)
  useEffect(() => {
    // Mock data is loaded directly via initial state
    // No additional fetching needed on mount
  }, [])
  
  // Use the GitHub data hook (but with empty repositories for mock mode to prevent API calls)
  const githubData = useGitHubData({
    repositories: config.mode === 'api' && config.apiConfig 
      ? [`${config.apiConfig.owner}/${config.apiConfig.repo}`] 
      : [], // Empty array prevents any API calls
    autoRefresh: config.mode === 'api' && config.autoRefresh,
    refreshInterval: config.refreshInterval,
    accessToken: config.apiConfig?.token,
    useWebSocket: config.mode === 'api'
  })
  
  // Select the appropriate data source based on mode
  const pullRequests: PullRequest[] = config.mode === 'mock' 
    ? mockPullRequests 
    : githubData.pullRequests as PullRequest[] // Type assertion since the types are compatible
  const loading = config.mode === 'mock' ? mockLoading : githubData.loading
  const error = config.mode === 'mock' ? mockError : githubData.error
  const refresh = config.mode === 'mock' ? fetchMockData : githubData.refresh
  const updatePRStatus = useMemo(() => {
    return config.mode === 'mock' 
      ? async (owner: string, repo: string, prNumber: number, action: 'close' | 'reopen' | 'merge') => {
          // In mock mode, find PR by number and update its status
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
  }, [config.mode, mockPullRequests, service, githubData.updatePRStatus, setMockPullRequests])
  
  // Group pull requests by issues
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
  }, [pullRequests])
  
  // Create wrapper for updatePullRequestStatus
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
      
      // Map status to action
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
  }, [config.mode, service, pullRequests, updatePRStatus, setMockPullRequests])
  
  // Create wrapper for deletePullRequests
  const deletePullRequests = useMemo(() => async (prIds: string[]) => {
    if (config.mode === 'mock') {
      const mockService = service as MockGitHubService
      await mockService.deletePullRequests(prIds)
      setMockPullRequests(prev => prev.filter(pr => !prIds.includes(pr.id)))
    } else {
      // For API mode, this would need custom implementation
      await service.deletePullRequests(prIds)
      // Refresh data after deletion
      await refresh()
    }
  }, [config.mode, service, refresh])

  // Deploy pull request functionality
  const deployPullRequest = useCallback(async (prId: string): Promise<{ success: boolean; liveLink?: string; error?: string }> => {
    const pr = pullRequests.find(p => p.id === prId)
    if (!pr) {
      return { success: false, error: 'Pull request not found' }
    }

    try {
      if (config.mode === 'mock') {
        // For mock mode, simulate deployment
        const mockLiveLink = `http://localhost:${4000 + Math.floor(Math.random() * 1000)}`
        const updatedPR = { ...pr, liveLink: mockLiveLink }
        setMockPullRequests(prev => prev.map(p => p.id === prId ? updatedPR : p))
        return { success: true, liveLink: mockLiveLink }
      } else {
        // For API mode, call the deployment endpoint
        let owner: string, repo: string
        if (typeof pr.repository === 'string') {
          [owner, repo] = pr.repository.split('/')
        } else if (pr.repository) {
          owner = pr.repository.owner
          repo = pr.repository.name
        } else {
          return { success: false, error: 'Repository information missing' }
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/repos/${owner}/${repo}/pull-requests/${pr.number}/deploy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(config.apiConfig?.token && { 'Authorization': `Bearer ${config.apiConfig.token}` })
            }
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          return { success: false, error: errorData.error || 'Deployment failed' }
        }

        const result = await response.json()
        
        // Refresh data to get updated PR with liveLink
        await refresh()
        
        return {
          success: result.success,
          liveLink: result.liveLink,
          error: result.error
        }
      }
    } catch (error) {
      console.error('Error deploying pull request:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Deployment failed' 
      }
    }
  }, [pullRequests, config, refresh, setMockPullRequests])

  // Stop deployment functionality
  const stopDeployment = useCallback(async (prId: string): Promise<{ success: boolean }> => {
    const pr = pullRequests.find(p => p.id === prId)
    if (!pr) {
      return { success: false }
    }

    try {
      if (config.mode === 'mock') {
        // For mock mode, simulate stopping deployment
        const updatedPR = { ...pr, liveLink: undefined, sshLink: undefined, logs: undefined }
        setMockPullRequests(prev => prev.map(p => p.id === prId ? updatedPR : p))
        return { success: true }
      } else {
        // For API mode, call the stop deployment endpoint
        let owner: string, repo: string
        if (typeof pr.repository === 'string') {
          [owner, repo] = pr.repository.split('/')
        } else if (pr.repository) {
          owner = pr.repository.owner
          repo = pr.repository.name
        } else {
          return { success: false }
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/repos/${owner}/${repo}/pull-requests/${pr.number}/deploy`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(config.apiConfig?.token && { 'Authorization': `Bearer ${config.apiConfig.token}` })
            }
          }
        )

        if (!response.ok) {
          return { success: false }
        }

        const result = await response.json()
        
        // Refresh data to get updated PR
        await refresh()
        
        return { success: result.success }
      }
    } catch (error) {
      console.error('Error stopping deployment:', error)
      return { success: false }
    }
  }, [pullRequests, config, refresh, setMockPullRequests])
  
  const value: GitHubContextValue = {
    // Original properties
    pullRequests,
    repositories: config.mode === 'mock' ? [] : githubData.repositories,
    loading,
    error: error ? new Error(error) : null,
    refresh,
    updatePRStatus,
    addComment: config.mode === 'mock' ? async () => {} : githubData.addComment,
    connected: config.mode === 'mock' ? false : githubData.connected,
    
    // Computed/mapped properties
    issues,
    updatePullRequestStatus,
    deletePullRequests,
    refetch: refresh, // Alias for refresh
    
    // Deployment functionality
    deployPullRequest,
    stopDeployment,
    
    // Context-specific properties
    config,
    service
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
