import { useState, useEffect, useCallback, useMemo } from 'react'
import { PullRequest, Issue, Repository } from '@/types/github'
import { GitHubService } from '@/services/github.service'
import { extractIssueName, formatIssueName } from '@/utils/github.utils'

export interface UseGitHubDataOptions {
  service: GitHubService
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseGitHubDataReturn {
  pullRequests: PullRequest[]
  issues: Issue[]
  repository: Repository | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updatePullRequestStatus: (prId: string, status: PullRequest['status']) => Promise<void>
  linkPullRequestToIssue: (prId: string, issueId: string) => Promise<void>
}

export function useGitHubData(options: UseGitHubDataOptions): UseGitHubDataReturn {
  const { service, autoRefresh = false, refreshInterval = 60000 } = options
  
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [repository, setRepository] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Group PRs into issues
  const issues = useMemo<Issue[]>(() => {
    const groupedByIssue = new Map<string, PullRequest[]>()
    
    pullRequests.forEach(pr => {
      const issueName = extractIssueName(pr.branchName, pr.sourceAgent)
      const existing = groupedByIssue.get(issueName) || []
      existing.push({ ...pr, issueId: issueName })
      groupedByIssue.set(issueName, existing)
    })
    
    return Array.from(groupedByIssue.entries()).map(([issueName, prs], index) => ({
      id: String(index + 1),
      title: formatIssueName(issueName),
      pullRequests: prs.map(pr => ({ ...pr, issueId: String(index + 1) })),
      isExpanded: true
    }))
  }, [pullRequests])
  
  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [fetchedPRs, fetchedRepo] = await Promise.all([
        service.fetchPullRequests(),
        service.fetchRepository()
      ])
      
      setPullRequests(fetchedPRs)
      setRepository(fetchedRepo)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
    } finally {
      setLoading(false)
    }
  }, [service])
  
  // Update PR status
  const updatePullRequestStatus = useCallback(async (prId: string, status: PullRequest['status']) => {
    try {
      const updatedPR = await service.updatePullRequestStatus(prId, status)
      setPullRequests(prev => prev.map(pr => pr.id === prId ? updatedPR : pr))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update PR status'))
      throw err
    }
  }, [service])
  
  // Link PR to issue
  const linkPullRequestToIssue = useCallback(async (prId: string, issueId: string) => {
    try {
      await service.linkPullRequestToIssue(prId, issueId)
      // Refetch to get updated data
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to link PR to issue'))
      throw err
    }
  }, [service, fetchData])
  
  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchData])
  
  return {
    pullRequests,
    issues,
    repository,
    loading,
    error,
    refetch: fetchData,
    updatePullRequestStatus,
    linkPullRequestToIssue
  }
}
