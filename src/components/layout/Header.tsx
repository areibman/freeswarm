"use client"

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { SignInButton } from '@/components/auth/SignInButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { RepositorySelector } from '@/components/repositories/RepositorySelector'

interface HeaderProps {
  selectedRepos: string[]
  onReposChange: (repos: string[]) => void
}

export function Header({ selectedRepos, onReposChange }: HeaderProps) {
  const { isAuthenticated, loading } = useAuth()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">FreeSwarm</h1>
            {isAuthenticated && (
              <RepositorySelector
                selectedRepos={selectedRepos}
                onReposChange={onReposChange}
              />
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : isAuthenticated ? (
              <UserMenu />
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}