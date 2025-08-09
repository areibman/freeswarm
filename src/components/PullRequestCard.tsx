"use client"

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  GitBranch, Copy, Check, Clock, ExternalLink, FileText, 
  MessageSquare, Files, History, Plus, Minus 
} from 'lucide-react'
import { PullRequest } from '@/types/github'
import { getStatusColor, formatRelativeTime, calculateFileChanges } from '@/utils/github.utils'

export interface PullRequestCardProps {
  pullRequest: PullRequest
  isSelected: boolean
  onSelectionChange: (checked: boolean) => void
  onStatusChange?: (status: PullRequest['status']) => void
  onScrollToIssue?: (issueId: string) => void
  className?: string
}

export function PullRequestCard({
  pullRequest: pr,
  isSelected,
  onSelectionChange,
  onStatusChange,
  onScrollToIssue,
  className = ''
}: PullRequestCardProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'files' | 'history' | null>(null)
  const [copiedBranch, setCopiedBranch] = useState(false)
  
  const fileStats = calculateFileChanges(pr.fileChanges)
  
  const copyBranchName = () => {
    navigator.clipboard.writeText(pr.branchName)
    setCopiedBranch(true)
    setTimeout(() => setCopiedBranch(false), 2000)
  }
  
  const toggleTab = (tab: 'description' | 'files' | 'history') => {
    setActiveTab(current => current === tab ? null : tab)
  }
  
  const handleStatusClick = () => {
    if (onStatusChange && pr.status !== 'merged') {
      // The parent component should handle the actual status cycling logic
      onStatusChange(pr.status)
    }
  }
  
  return (
    <div className={`p-2 ${isSelected ? 'bg-accent' : ''} hover:bg-accent/50 transition-colors ${className}`}>
      <div className="flex items-start gap-2">
        <Checkbox
          id={`pr-${pr.id}`}
          checked={isSelected}
          onCheckedChange={onSelectionChange}
          aria-label={`Select PR ${pr.branchName}`}
          className="mt-0.5"
        />
        
        <div className="flex-1 space-y-2">
          {/* Branch Name and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={copyBranchName}
                className="flex items-center gap-1 hover:opacity-70 transition-opacity group"
                title="Click to copy branch name"
              >
                <GitBranch className="h-3 w-3" />
                <span className="text-xs font-medium underline underline-offset-1 decoration-dotted">
                  {pr.branchName}
                </span>
                {copiedBranch ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStatusClick}
                className={`text-[9px] font-bold uppercase px-2 py-0.5 border transition-opacity ${getStatusColor(pr.status)} ${
                  pr.status === 'merged' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                }`}
                title={pr.status === 'merged' ? 'Merged PRs cannot be changed' : 'Click to change status'}
                disabled={pr.status === 'merged'}
              >
                {pr.status}
              </button>
              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2 w-2" />
                {formatRelativeTime(pr.lastUpdated)}
              </span>
            </div>
          </div>
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Model */}
            <div>
              <span className="text-muted-foreground uppercase block text-[10px]">MODEL</span>
              <span className="font-medium">
                {pr.model || '[PENDING]'}
              </span>
            </div>
            
            {/* Agent */}
            <div>
              <span className="text-muted-foreground uppercase block text-[10px]">AGENT</span>
              {pr.sourceAgent ? (
                <button
                  onClick={() => onScrollToIssue?.(pr.issueId || '')}
                  className="font-medium hover:underline"
                  title="Scroll to Issue"
                >
                  {pr.sourceAgent}
                </button>
              ) : (
                <span className="font-medium">[PENDING]</span>
              )}
            </div>
            
            {/* Live Link */}
            <div>
              <span className="text-muted-foreground uppercase block text-[10px]">PREVIEW</span>
              {pr.liveLink ? (
                <a
                  href={pr.liveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline font-medium"
                >
                  <span>LIVE</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-medium">[N/A]</span>
              )}
            </div>
            
            {/* Logs */}
            <div>
              <span className="text-muted-foreground uppercase block text-[10px]">LOGS</span>
              {pr.logs ? (
                <a
                  href={pr.logs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline font-medium"
                >
                  <span>VIEW</span>
                  <FileText className="h-3 w-3" />
                </a>
              ) : (
                <span className="font-medium">[N/A]</span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-3 border-t border-foreground/20 pt-2">
            <button
              onClick={() => toggleTab('description')}
              className={`flex items-center gap-1 text-[10px] uppercase px-2 py-1 border transition-colors ${
                activeTab === 'description'
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground hover:text-foreground border-foreground/20'
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              Description
            </button>
            <button
              onClick={() => toggleTab('files')}
              className={`flex items-center gap-1 text-[10px] uppercase px-2 py-1 border transition-colors ${
                activeTab === 'files'
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground hover:text-foreground border-foreground/20'
              }`}
            >
              <Files className="h-3 w-3" />
              {fileStats.totalFiles} Files
              <span className="text-green-600 dark:text-green-400">
                +{fileStats.totalAdditions}
              </span>
              <span className="text-red-600 dark:text-red-400">
                -{fileStats.totalDeletions}
              </span>
            </button>
            <button
              onClick={() => toggleTab('history')}
              className={`flex items-center gap-1 text-[10px] uppercase px-2 py-1 border transition-colors ${
                activeTab === 'history'
                  ? 'bg-foreground text-background border-foreground'
                  : 'text-muted-foreground hover:text-foreground border-foreground/20'
              }`}
            >
              <History className="h-3 w-3" />
              History ({pr.updateLogs.length})
            </button>
          </div>
          
          {/* Content Area */}
          {activeTab && (
            <div className="mt-3 p-3 bg-secondary/50 border border-foreground/10">
              {/* Description Content */}
              {activeTab === 'description' && (
                <div className="text-xs">
                  {pr.description}
                </div>
              )}
              
              {/* File Changes Content */}
              {activeTab === 'files' && (
                <div className="space-y-1">
                  {pr.fileChanges.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] p-1 hover:bg-background/50 rounded">
                      <span className="font-mono truncate flex-1">{file.filename}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                          <Plus className="h-2 w-2" />
                          {file.additions}
                        </span>
                        <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                          <Minus className="h-2 w-2" />
                          {file.deletions}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Update History Content */}
              {activeTab === 'history' && (
                <div className="space-y-1">
                  {pr.updateLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[10px]">
                      <span className="text-muted-foreground">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                      <span className="flex-1">{log.action}</span>
                      <span className="text-muted-foreground">@{log.user}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
