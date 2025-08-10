"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ChevronsUpDown, ChevronsDown, ChevronsUp, Sun, Moon, Trash2, Terminal 
} from 'lucide-react'
import { IssueCard } from '@/components/IssueCard'
import { useGitHub } from '@/contexts/GitHubContext'
import { getNextStatus } from '@/utils/github.utils'
import { PullRequest } from '@/types/github'

export function PRManager() {
  const { 
    issues, 
    pullRequests, 
    loading, 
    error, 
    updatePullRequestStatus,
    refetch 
  } = useGitHub()
  
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())
  const [selectedPRs, setSelectedPRs] = useState<Set<string>>(new Set())
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set())
  const [highlightedIssue, setHighlightedIssue] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Initialize expanded issues when data loads
  useEffect(() => {
    if (issues.length > 0 && expandedIssues.size === 0) {
      setExpandedIssues(new Set(issues.map(i => i.id)))
    }
  }, [issues, expandedIssues.size])
  
  // Initialize dark mode from localStorage and system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored) {
      setIsDarkMode(stored === 'dark')
      if (stored === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }
  
  const allExpanded = issues && expandedIssues.size === issues.length
  const allCollapsed = expandedIssues.size === 0
  
  const toggleAllIssues = () => {
    if (!issues) return
    if (allExpanded || (!allExpanded && !allCollapsed)) {
      // Collapse all
      setExpandedIssues(new Set())
    } else {
      // Expand all
      setExpandedIssues(new Set(issues.map(i => i.id)))
    }
  }
  
  const toggleIssueExpanded = (issueId: string) => {
    const newExpanded = new Set(expandedIssues)
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId)
    } else {
      newExpanded.add(issueId)
    }
    setExpandedIssues(newExpanded)
  }
  
  const togglePRSelection = (prId: string, checked: boolean) => {
    const newSelected = new Set(selectedPRs)
    if (checked) {
      newSelected.add(prId)
    } else {
      newSelected.delete(prId)
    }
    setSelectedPRs(newSelected)
  }
  
  const toggleIssueSelection = (issueId: string, checked: boolean) => {
    const issue = issues.find(i => i.id === issueId)
    if (!issue) return
    
    const newSelectedPRs = new Set(selectedPRs)
    const newSelectedIssues = new Set(selectedIssues)
    
    if (checked) {
      // Select issue and all its PRs
      newSelectedIssues.add(issueId)
      issue.pullRequests.forEach(pr => {
        newSelectedPRs.add(pr.id)
      })
    } else {
      // Deselect issue and all its PRs
      newSelectedIssues.delete(issueId)
      issue.pullRequests.forEach(pr => {
        newSelectedPRs.delete(pr.id)
      })
    }
    
    setSelectedIssues(newSelectedIssues)
    setSelectedPRs(newSelectedPRs)
  }
  
  const deleteSelected = () => {
    // This would normally update the backend
    // For now, just clear selections
    setSelectedPRs(new Set())
    setSelectedIssues(new Set())
    // In production, you'd call a delete service method here
    console.log('Delete selected PRs:', Array.from(selectedPRs))
  }
  
  const scrollToIssue = (issueId: string) => {
    // Expand the issue if it's collapsed
    setExpandedIssues(prev => new Set([...prev, issueId]))
    
    // Scroll to the issue element
    setTimeout(() => {
      const element = document.getElementById(`issue-container-${issueId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Add highlight effect
        setHighlightedIssue(issueId)
        setTimeout(() => setHighlightedIssue(null), 2000)
      }
    }, 100)
  }
  
  const handlePRStatusChange = async (prId: string, currentStatus: PullRequest['status']) => {
    const nextStatus = getNextStatus(currentStatus)
    try {
      await updatePullRequestStatus(prId, nextStatus)
    } catch (error) {
      console.error('Failed to update PR status:', error)
    }
  }
  
  const hasSelection = selectedPRs.size > 0
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 animate-pulse" />
          <span className="text-sm uppercase tracking-wider">Loading PR Data...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading data: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 border-b border-foreground pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wider">Freeswarm</h1>
              <p className="text-muted-foreground text-xs">Multi-Agent PR Competition Tracker</p>
            </div>
            <div className="flex items-center gap-3">
              {hasSelection && (
                <>
                  <span className="text-xs uppercase text-muted-foreground">
                    {selectedPRs.size} SELECTED
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelected}
                    className="h-6 px-3 py-0 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    DELETE
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="h-6 w-6 p-0 text-xs border-foreground"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <Sun className="h-3 w-3" />
                ) : (
                  <Moon className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats and Controls */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {issues.length} ISSUES • {pullRequests.length} TOTAL PRS
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllIssues}
            className="h-6 px-2 py-0 text-xs"
          >
            {allExpanded ? (
              <>
                <ChevronsUp className="h-3 w-3 mr-1" />
                COLLAPSE ALL
              </>
            ) : allCollapsed ? (
              <>
                <ChevronsDown className="h-3 w-3 mr-1" />
                EXPAND ALL
              </>
            ) : (
              <>
                <ChevronsUpDown className="h-3 w-3 mr-1" />
                COLLAPSE ALL
              </>
            )}
          </Button>
        </div>
        
        {/* Issues List */}
        <div className="space-y-3">
          {issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isExpanded={expandedIssues.has(issue.id)}
              isHighlighted={highlightedIssue === issue.id}
              selectedPRs={selectedPRs}
              onToggleExpanded={toggleIssueExpanded}
              onIssueSelectionChange={toggleIssueSelection}
              onPRSelectionChange={togglePRSelection}
              onPRStatusChange={handlePRStatusChange}
              onScrollToIssue={scrollToIssue}
            />
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-foreground">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>SYSTEM STATUS: OPERATIONAL</span>
            <span>LAST SYNC: REALTIME</span>
          </div>
        </div>
      </div>
    </main>
  )
}
