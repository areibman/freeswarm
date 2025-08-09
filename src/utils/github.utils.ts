import { PullRequestStatus, AgentType } from '@/types/github'

// Function to extract issue name from branch based on agent conventions
export function extractIssueName(branchName: string, agent: AgentType | null): string {
  if (!agent) return 'unknown-issue'
  
  const parts = branchName.split('/')
  if (parts.length < 2) return 'unknown-issue'
  
  const branchPart = parts.slice(1).join('/')
  
  switch(agent.toLowerCase()) {
    case 'devin':
      // devin/<guid>-kebab-case-issue-name
      const devinMatch = branchPart.match(/^[a-z0-9]+-(.+)$/i)
      if (devinMatch) return devinMatch[1]
      break
      
    case 'cursor':
      // cursor/kebab-case-issue-name-<guid>
      const cursorMatch = branchPart.match(/^(.+)-[a-z0-9]+$/i)
      if (cursorMatch) return cursorMatch[1]
      break
      
    case 'codex':
      // <guid>-codex/kebab-case-issue-name
      const codexParts = branchName.split('/')
      if (codexParts.length >= 2) {
        return codexParts[codexParts.length - 1]
      }
      break
  }
  
  return branchPart || 'unknown-issue'
}

// Function to format issue name from kebab-case
export function formatIssueName(issueName: string): string {
  return issueName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Function to get status color classes
export function getStatusColor(status: PullRequestStatus): string {
  switch(status) {
    case 'draft': return 'text-gray-500 bg-gray-100 border-gray-300'
    case 'open': return 'text-green-700 bg-green-50 border-green-300'
    case 'closed': return 'text-red-700 bg-red-50 border-red-300'
    case 'merged': return 'text-purple-700 bg-purple-50 border-purple-300'
    default: return 'text-gray-500 bg-gray-100 border-gray-300'
  }
}

// Function to get next status in cycle (merged status cannot be changed)
export function getNextStatus(currentStatus: PullRequestStatus): PullRequestStatus {
  // Merged PRs cannot be changed
  if (currentStatus === 'merged') return 'merged'
  
  // Cycle only between draft, open, and closed
  const statusCycle: PullRequestStatus[] = ['draft', 'open', 'closed']
  const currentIndex = statusCycle.indexOf(currentStatus)
  const nextIndex = (currentIndex + 1) % statusCycle.length
  return statusCycle[nextIndex]
}

// Function to format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// Function to calculate total file changes
export function calculateFileChanges(fileChanges: { additions: number; deletions: number }[]): {
  totalAdditions: number
  totalDeletions: number
  totalFiles: number
} {
  return fileChanges.reduce(
    (acc, file) => ({
      totalAdditions: acc.totalAdditions + file.additions,
      totalDeletions: acc.totalDeletions + file.deletions,
      totalFiles: acc.totalFiles + 1
    }),
    { totalAdditions: 0, totalDeletions: 0, totalFiles: 0 }
  )
}
