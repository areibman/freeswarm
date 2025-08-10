"use client"

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Issue, PullRequest } from '@/types/github'
import { PullRequestCard } from './PullRequestCard'

export interface IssueCardProps {
  issue: Issue
  isExpanded: boolean
  isHighlighted?: boolean
  selectedPRs: Set<string>
  onToggleExpanded: (issueId: string) => void
  onIssueSelectionChange: (issueId: string, checked: boolean) => void
  onPRSelectionChange: (prId: string, checked: boolean) => void
  onPRStatusChange?: (prId: string, status: PullRequest['status']) => void
  onScrollToIssue?: (issueId: string) => void
}

export function IssueCard({
  issue,
  isExpanded,
  isHighlighted = false,
  selectedPRs,
  onToggleExpanded,
  onIssueSelectionChange,
  onPRSelectionChange,
  onPRStatusChange,
  onScrollToIssue
}: IssueCardProps) {
  const hasMergedPR = issue.pullRequests.some(pr => pr.status === 'merged')
  const allPRsSelected = issue.pullRequests.every(pr => selectedPRs.has(pr.id))
  const somePRsSelected = issue.pullRequests.some(pr => selectedPRs.has(pr.id)) && !allPRsSelected
  
  const uniqueAgents = [...new Set(issue.pullRequests.map(pr => pr.sourceAgent))].filter(Boolean)
  
  return (
    <div
      id={`issue-container-${issue.id}`}
      className={`border transition-all duration-500 ${
        hasMergedPR ? 'border-purple-600 dark:border-purple-400' : 'border-foreground'
      } ${
        isHighlighted ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
    >
      {/* Issue Header */}
      <div className={`p-2 border-b ${
        hasMergedPR
          ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-600 dark:border-purple-400'
          : 'bg-secondary border-foreground'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`issue-${issue.id}`}
              checked={somePRsSelected ? "indeterminate" : allPRsSelected}
              onCheckedChange={(checked) => onIssueSelectionChange(issue.id, checked === true)}
              aria-label={`Select all PRs for issue ${issue.id}`}
            />
            <button
              onClick={() => onToggleExpanded(issue.id)}
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span className="text-xs font-bold uppercase">
                {issue.title}
              </span>
            </button>
            {hasMergedPR && (
              <span title="Has merged PR">
                <CheckCircle2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasMergedPR && (
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-purple-600 dark:bg-purple-500 text-white">
                COMPLETE
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {issue.pullRequests.length} COMPETING PR{issue.pullRequests.length !== 1 ? 'S' : ''}
            </span>
            {uniqueAgents.length > 0 && (
              <div className="flex items-center gap-2">
                {uniqueAgents.map((agent, idx) => (
                  <span 
                    key={idx}
                    className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-foreground text-background border border-foreground"
                  >
                    {agent}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Pull Requests */}
      {isExpanded && (
        <div className="divide-y divide-foreground">
          {issue.pullRequests.map(pr => (
            <PullRequestCard
              key={pr.id}
              pullRequest={pr}
              isSelected={selectedPRs.has(pr.id)}
              onSelectionChange={(checked) => onPRSelectionChange(pr.id, checked)}
              onStatusChange={(status) => onPRStatusChange?.(pr.id, status)}
              onScrollToIssue={onScrollToIssue}
            />
          ))}
        </div>
      )}
    </div>
  )
}
