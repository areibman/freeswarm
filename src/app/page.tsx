"use client"

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { SignInButton } from '@/components/auth/SignInButton'
import { GitHubProvider } from '@/contexts/GitHubContext'
import { PRManager } from '@/components/PRManager'
import { githubConfig } from '@/config/github.config'

export default function Home() {
  const { isAuthenticated, loading } = useAuth()
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header selectedRepos={selectedRepos} onReposChange={setSelectedRepos} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-3xl font-bold mb-4">Welcome to FreeSwarm</h1>
            <p className="text-muted-foreground mb-8">
              Sign in with GitHub to start managing your pull requests efficiently
            </p>
            <div className="flex justify-center">
              <SignInButton className="px-8 py-3 text-lg" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header selectedRepos={selectedRepos} onReposChange={setSelectedRepos} />
      <main className="flex-1">
        {selectedRepos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">No repositories selected</h2>
              <p className="text-muted-foreground">
                Use the "Manage Repositories" button in the header to connect your GitHub repositories
              </p>
            </div>
          </div>
        ) : (
          <GitHubProvider config={{
            ...githubConfig,
            mode: 'api',
            apiConfig: {
              ...githubConfig.apiConfig,
              owner: githubConfig.apiConfig?.owner || 'default-owner',
              repo: githubConfig.apiConfig?.repo || 'default-repo',
              repositories: selectedRepos,
            }
          }}>
            <PRManager />
          </GitHubProvider>
        )}
      </main>
    </div>
  )
}