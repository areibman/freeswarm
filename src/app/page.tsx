"use client"

import { GitHubProvider } from '@/contexts/GitHubContext'
import { PRManager } from '@/components/PRManager'
import { githubConfig } from '@/config/github.config'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth()

  // If user is authenticated, use their connected repos
  const config = {
    ...githubConfig,
    // Override mode to use API if authenticated
    mode: isAuthenticated ? 'api' as const : githubConfig.mode,
    apiConfig: isAuthenticated && user ? {
      ...githubConfig.apiConfig,
      // Use authenticated user's token from backend
      token: localStorage.getItem('token') || undefined,
    } : githubConfig.apiConfig,
  }

  return (
    <div>
      {/* Header with auth status */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">FreeSwarm PR Manager</h1>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
              ) : isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {user.name || user.username}
                    </span>
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  Sign in with GitHub
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Show message if not authenticated */}
      {!loading && !isAuthenticated && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Note:</strong> You're viewing mock data. {' '}
              <Link href="/login" className="underline font-medium">
                Sign in with GitHub
              </Link>
              {' '} to connect your repositories and see real pull requests.
            </p>
          </div>
        </div>
      )}

      {/* Show message if authenticated but no repos connected */}
      {!loading && isAuthenticated && user && (!user.connectedRepos || user.connectedRepos.length === 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Welcome!</strong> You haven't connected any repositories yet. {' '}
              <Link href="/dashboard" className="underline font-medium">
                Go to Dashboard
              </Link>
              {' '} to connect your GitHub repositories.
            </p>
          </div>
        </div>
      )}

      {/* Main PR Manager */}
      <GitHubProvider config={config}>
        <PRManager />
      </GitHubProvider>
    </div>
  )
}