"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Github, Search, Settings } from 'lucide-react'

interface Repository {
  id: string
  name: string
  fullName: string
  owner: string
  private: boolean
  description: string
  defaultBranch: string
  url: string
}

interface RepositorySelectorProps {
  selectedRepos: string[]
  onReposChange: (repos: string[]) => void
}

export function RepositorySelector({ selectedRepos, onReposChange }: RepositorySelectorProps) {
  const { session } = useAuth()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const fetchRepositories = React.useCallback(async () => {
    if (!session?.accessToken) return

    setLoading(true)
    try {
      const response = await fetch('/api/repositories', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      })

      if (response.ok) {
        const repos = await response.json()
        setRepositories(repos)
      } else {
        console.error('Failed to fetch repositories')
      }
    } catch (error) {
      console.error('Error fetching repositories:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.accessToken])

  useEffect(() => {
    if (isOpen && session?.accessToken) {
      fetchRepositories()
    }
  }, [isOpen, session?.accessToken, fetchRepositories])

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.owner.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRepoToggle = (repoFullName: string) => {
    const newSelectedRepos = selectedRepos.includes(repoFullName)
      ? selectedRepos.filter(repo => repo !== repoFullName)
      : [...selectedRepos, repoFullName]
    
    onReposChange(newSelectedRepos)
  }

  const handleSelectAll = () => {
    const allRepoNames = filteredRepositories.map(repo => repo.fullName)
    onReposChange(allRepoNames)
  }

  const handleDeselectAll = () => {
    onReposChange([])
  }

  if (!session?.accessToken) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Please sign in with GitHub to connect your repositories
        </p>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Manage Repositories
          {selectedRepos.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedRepos.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Connect GitHub Repositories</DialogTitle>
          <DialogDescription>
            Select the repositories you want to manage with FreeSwarm
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search and controls */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Clear
            </Button>
          </div>

          {/* Repository list */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading repositories...
              </div>
            ) : filteredRepositories.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? 'No repositories found' : 'No repositories available'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredRepositories.map((repo) => (
                  <div key={repo.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={repo.id}
                        checked={selectedRepos.includes(repo.fullName)}
                        onCheckedChange={() => handleRepoToggle(repo.fullName)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor={repo.id} className="font-medium cursor-pointer">
                            {repo.fullName}
                          </Label>
                          {repo.private && (
                            <Badge variant="outline" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Default: {repo.defaultBranch}</span>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <Github className="w-3 h-3" />
                            View on GitHub
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedRepos.length} repository{selectedRepos.length !== 1 ? 's' : ''} selected
            </span>
            <Button onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}