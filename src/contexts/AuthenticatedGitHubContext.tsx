"use client"

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PullRequest, Issue } from '@/types/github'

interface Repository {
  id: string
  name: string
  fullName: string
  owner: string
  private: boolean
  description: string | null
  defaultBranch: string
  url: string
  connectedAt?: string
}

interface AuthenticatedGitHubContextValue {
  // Repository management
  connectedRepositories: Repository[]
  availableRepositories: Repository[]
  
  // Data for selected repositories
  pullRequests: PullRequest[]
  issues: Issue[]
  
  // Loading states
  loading: boolean
  repositoriesLoading: boolean
  
  // Error handling
  error: Error | null
  
  // Actions
  connectRepository: (repo: Repository) => Promise<void>
  disconnectRepository: (repoId: string) => Promise<void>
  refreshRepositories: () => Promise<void>
  refreshPullRequests: () => Promise<void>
  updatePullRequestStatus: (prId: string, status: PullRequest['status']) => Promise<void>
  
  // Selected repository for data viewing
  selectedRepository: Repository | null
  setSelectedRepository: (repo: Repository | null) => void
}

const AuthenticatedGitHubContext = createContext<AuthenticatedGitHubContextValue | undefined>(undefined)

export interface AuthenticatedGitHubProviderProps {
  children: ReactNode
}

export function AuthenticatedGitHubProvider({ children }: AuthenticatedGitHubProviderProps) {
  const { session, status } = useAuth()
  const [connectedRepositories, setConnectedRepositories] = useState<Repository[]>([])
  const [availableRepositories, setAvailableRepositories] = useState<Repository[]>([])
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(false)
  const [repositoriesLoading, setRepositoriesLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const getAuthHeaders = useCallback(() => {
    if (!session?.accessToken) {
      throw new Error('No authentication token available')
    }
    return {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json'
    }
  }, [session?.accessToken])

  const refreshRepositories = useCallback(async () => {
    if (status !== 'authenticated' || !session?.accessToken) return

    try {
      setRepositoriesLoading(true)
      setError(null)
      const headers = getAuthHeaders()

      // Fetch connected repositories
      const connectedResponse = await fetch(`${apiUrl}/api/repositories`, { headers })
      if (!connectedResponse.ok) throw new Error('Failed to fetch connected repositories')
      const connected = await connectedResponse.json()

      // Fetch available repositories
      const availableResponse = await fetch(`${apiUrl}/api/repositories/available`, { headers })
      if (!availableResponse.ok) throw new Error('Failed to fetch available repositories')
      const available = await availableResponse.json()

      setConnectedRepositories(connected)
      setAvailableRepositories(available)

      // If we have connected repositories and no selected repository, select the first one
      if (connected.length > 0 && !selectedRepository) {
        setSelectedRepository(connected[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch repositories'))
    } finally {
      setRepositoriesLoading(false)
    }
  }, [status, session?.accessToken, getAuthHeaders, apiUrl, selectedRepository])

  const refreshPullRequests = useCallback(async () => {
    if (!selectedRepository || status !== 'authenticated' || !session?.accessToken) {
      setPullRequests([])
      setIssues([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const headers = getAuthHeaders()

      // Fetch pull requests for selected repository
      const prResponse = await fetch(`${apiUrl}/api/repositories/${selectedRepository.id}/pull-requests`, { headers })
      if (!prResponse.ok) throw new Error('Failed to fetch pull requests')
      const pullRequestsData = await prResponse.json()

      // Fetch issues for selected repository
      const issuesResponse = await fetch(`${apiUrl}/api/repositories/${selectedRepository.id}/issues`, { headers })
      if (!issuesResponse.ok) throw new Error('Failed to fetch issues')
      const issuesData = await issuesResponse.json()

      setPullRequests(pullRequestsData)
      setIssues(issuesData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
    } finally {
      setLoading(false)
    }
  }, [selectedRepository, status, session?.accessToken, getAuthHeaders, apiUrl])

  const connectRepository = useCallback(async (repo: Repository) => {
    try {
      setError(null)
      const headers = getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/repositories/connect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          repositoryId: repo.id,
          fullName: repo.fullName,
          name: repo.name,
          owner: repo.owner,
          isPrivate: repo.private,
          description: repo.description,
          defaultBranch: repo.defaultBranch,
          url: repo.url
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to connect repository')
      }

      await refreshRepositories()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect repository'))
      throw err
    }
  }, [getAuthHeaders, apiUrl, refreshRepositories])

  const disconnectRepository = useCallback(async (repoId: string) => {
    try {
      setError(null)
      const headers = getAuthHeaders()

      const response = await fetch(`${apiUrl}/api/repositories/${repoId}/disconnect`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to disconnect repository')
      }

      // If we disconnected the selected repository, clear the selection
      if (selectedRepository?.id === repoId) {
        setSelectedRepository(null)
        setPullRequests([])
        setIssues([])
      }

      await refreshRepositories()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect repository'))
      throw err
    }
  }, [getAuthHeaders, apiUrl, selectedRepository?.id, refreshRepositories])

  const updatePullRequestStatus = useCallback(async (prId: string, status: PullRequest['status']) => {
    // This would need to be implemented based on the specific PR management requirements
    // For now, just refresh the data
    await refreshPullRequests()
  }, [refreshPullRequests])

  // Load repositories when authentication state changes
  useEffect(() => {
    if (status === 'authenticated') {
      refreshRepositories()
    } else {
      setConnectedRepositories([])
      setAvailableRepositories([])
      setPullRequests([])
      setIssues([])
      setSelectedRepository(null)
    }
  }, [status, refreshRepositories])

  // Load pull requests when selected repository changes
  useEffect(() => {
    refreshPullRequests()
  }, [selectedRepository, refreshPullRequests])

  const value: AuthenticatedGitHubContextValue = {
    connectedRepositories,
    availableRepositories,
    pullRequests,
    issues,
    loading,
    repositoriesLoading,
    error,
    connectRepository,
    disconnectRepository,
    refreshRepositories,
    refreshPullRequests,
    updatePullRequestStatus,
    selectedRepository,
    setSelectedRepository
  }

  return (
    <AuthenticatedGitHubContext.Provider value={value}>
      {children}
    </AuthenticatedGitHubContext.Provider>
  )
}

export function useAuthenticatedGitHub() {
  const context = useContext(AuthenticatedGitHubContext)
  if (context === undefined) {
    throw new Error('useAuthenticatedGitHub must be used within an AuthenticatedGitHubProvider')
  }
  return context
}