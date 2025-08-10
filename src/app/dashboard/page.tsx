"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string;
  private: boolean;
  html_url: string;
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading, logout, connectRepository, disconnectRepository } = useAuth();
  const router = useRouter();
  const [availableRepos, setAvailableRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectingRepo, setConnectingRepo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableRepos();
    }
  }, [isAuthenticated]);

  const fetchAvailableRepos = async () => {
    setLoadingRepos(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/repositories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const repos = await response.json();
        setAvailableRepos(repos);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleConnectRepo = async (owner: string, repo: string) => {
    setConnectingRepo(`${owner}/${repo}`);
    try {
      await connectRepository(owner, repo);
    } catch (error) {
      console.error('Error connecting repository:', error);
      alert('Failed to connect repository: ' + (error as Error).message);
    } finally {
      setConnectingRepo(null);
    }
  };

  const handleDisconnectRepo = async (owner: string, repo: string) => {
    if (confirm(`Are you sure you want to disconnect ${owner}/${repo}?`)) {
      try {
        await disconnectRepository(owner, repo);
      } catch (error) {
        console.error('Error disconnecting repository:', error);
        alert('Failed to disconnect repository');
      }
    }
  };

  const isRepoConnected = (owner: string, repo: string) => {
    return user?.connectedRepos?.some(r => r.owner === owner && r.repo === repo) || false;
  };

  const filteredRepos = availableRepos.filter(repo =>
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Pull Requests →
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">{user.name || user.username}</span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-16 w-16 rounded-full"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.name || user.username}</h2>
              <p className="text-gray-600">@{user.username}</p>
              {user.email && (
                <p className="text-sm text-gray-500">{user.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Connected Repositories */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Repositories</h3>
          {user.connectedRepos && user.connectedRepos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.connectedRepos.map(repo => (
                <div key={`${repo.owner}/${repo.repo}`} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{repo.repo}</h4>
                      <p className="text-sm text-gray-500">{repo.owner}</p>
                    </div>
                    <button
                      onClick={() => handleDisconnectRepo(repo.owner, repo.repo)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 bg-white rounded-lg shadow p-4">
              No repositories connected yet. Add repositories below to start managing pull requests.
            </p>
          )}
        </div>

        {/* Available Repositories */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Repositories</h3>
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {loadingRepos ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRepos.map(repo => {
                const isConnected = isRepoConnected(repo.owner.login, repo.name);
                const isConnecting = connectingRepo === repo.full_name;
                
                return (
                  <div key={repo.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {repo.name}
                          {repo.private && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Private</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">{repo.owner.login}</p>
                        {repo.description && (
                          <p className="text-sm text-gray-600">{repo.description}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        {isConnected ? (
                          <span className="text-green-600 text-sm font-medium">Connected</span>
                        ) : (
                          <button
                            onClick={() => handleConnectRepo(repo.owner.login, repo.name)}
                            disabled={isConnecting}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredRepos.length === 0 && !loadingRepos && (
            <p className="text-gray-500 text-center py-8">
              No repositories found matching your search.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}