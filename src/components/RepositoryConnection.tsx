"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Repository {
  id: string
  name: string
  fullName: string
  owner: string
  private: boolean
  description: string | null
  defaultBranch: string
  url: string
  connected?: boolean
  connectedAt?: string
}

export function RepositoryConnection() {
  const { session, status } = useAuth()
  const [connectedRepos, setConnectedRepos] = useState<Repository[]>([])
  const [availableRepos, setAvailableRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      fetchRepositories()
    }
  }, [status, session])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers = {
        'Authorization': `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json'
      }

      // Fetch connected repositories
      const connectedResponse = await fetch(`${apiUrl}/api/repositories`, { headers })
      if (!connectedResponse.ok) {
        throw new Error('Failed to fetch connected repositories')
      }
      const connected = await connectedResponse.json()

      // Fetch available repositories
      const availableResponse = await fetch(`${apiUrl}/api/repositories/available`, { headers })
      if (!availableResponse.ok) {
        throw new Error('Failed to fetch available repositories')
      }
      const available = await availableResponse.json()

      setConnectedRepos(connected)
      setAvailableRepos(available)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories')
    } finally {
      setLoading(false)
    }
  }

  const connectRepository = async (repo: Repository) => {
    try {
      setConnecting(repo.id)
      setError(null)

      const response = await fetch(`${apiUrl}/api/repositories/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
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

      // Refresh the lists
      await fetchRepositories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect repository')
    } finally {
      setConnecting(null)
    }
  }

  const disconnectRepository = async (repoId: string) => {
    try {
      setDisconnecting(repoId)
      setError(null)

      const response = await fetch(`${apiUrl}/api/repositories/${repoId}/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to disconnect repository')
      }

      // Refresh the lists
      await fetchRepositories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect repository')
    } finally {
      setDisconnecting(null)
    }
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 mb-4">Please sign in to manage your repositories.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Repository Management</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Repositories */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Repositories</h2>
        {loading ? (
          <div className="text-center py-8">Loading repositories...</div>
        ) : connectedRepos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No repositories connected yet.</p>
            <p className="text-sm text-gray-500 mt-1">Connect repositories below to start managing pull requests.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectedRepos.map((repo) => (
              <div key={repo.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {repo.fullName}
                    </h3>
                    {repo.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 space-x-2">
                      {repo.private && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Connected {new Date(repo.connectedAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => disconnectRepository(repo.id)}
                    disabled={disconnecting === repo.id}
                    className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {disconnecting === repo.id ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Repositories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Repositories</h2>
        {loading ? (
          <div className="text-center py-8">Loading available repositories...</div>
        ) : availableRepos.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">All your repositories are already connected!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableRepos.map((repo) => (
              <div key={repo.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {repo.fullName}
                    </h3>
                    {repo.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2">
                      {repo.private && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => connectRepository(repo)}
                    disabled={connecting === repo.id}
                    className="ml-2 inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {connecting === repo.id ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}