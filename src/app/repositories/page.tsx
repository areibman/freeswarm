"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AuthButton from '@/components/AuthButton'

interface Repo {
  id: string
  fullName: string
  private: boolean
}

export default function RepositoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repos, setRepos] = useState<Repo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      const fetchRepos = async () => {
        setLoading(true)
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/repositories`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
          if (!res.ok) throw new Error('Failed to fetch repositories')
          const data: Repo[] = await res.json()
          setRepos(data)
        } catch (err) {
          setError((err as Error).message)
        } finally {
          setLoading(false)
        }
      }
      fetchRepos()
    }
  }, [status, session?.accessToken])

  const toggleRepo = (id: string) => {
    setSelected(prev => {
      const copy = new Set(prev)
      copy.has(id) ? copy.delete(id) : copy.add(id)
      return copy
    })
  }

  const saveSelection = async () => {
    try {
      const body = { repositories: Array.from(selected) }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(body),
      })
      router.push('/')
    } catch (err) {
      alert('Failed to save preferences')
    }
  }

  if (status === 'loading') return <p>Loading session...</p>
  if (!session) return <div className="p-6"><AuthButton /></div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Select GitHub Repositories</h1>
      {loading && <p>Loading repositories...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <ul className="space-y-2 max-h-[60vh] overflow-auto border p-4 rounded">
        {repos.map(repo => (
          <li key={repo.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.has(repo.fullName)}
              onChange={() => toggleRepo(repo.fullName)}
            />
            <span>{repo.fullName}{repo.private ? ' (private)' : ''}</span>
          </li>
        ))}
        {repos.length === 0 && !loading && <p>No repositories found.</p>}
      </ul>
      <button
        disabled={selected.size === 0}
        onClick={saveSelection}
        className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        Save Selection
      </button>
    </div>
  )
}