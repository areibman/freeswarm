"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { GitHubService } from '@/services/github.service'
import { MockGitHubService } from '@/services/mock-github.service'
import { GitHubAPIService } from '@/services/github.service'
import { useGitHubData, UseGitHubDataReturn } from '@/hooks/useGitHubData'

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

interface GitHubContextValue extends UseGitHubDataReturn {
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
  
  // Use the GitHub data hook
  const githubData = useGitHubData({
    service,
    autoRefresh: config.autoRefresh,
    refreshInterval: config.refreshInterval
  })
  
  const value: GitHubContextValue = {
    ...githubData,
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
