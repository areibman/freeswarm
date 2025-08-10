import { GitHubProvider } from '@/contexts/GitHubContext'
import { PRManager } from '@/components/PRManager'
import { githubConfig } from '@/config/github.config'
import Link from 'next/link'

async function getSession(): Promise<{ authenticated: boolean; user?: { id: string; login: string } }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/session`, {
      cache: 'no-store',
      credentials: 'include' as RequestCredentials,
    });
    return res.ok ? res.json() : { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

export default async function Home() {
  const session = await getSession();
  const isAuthed = session.authenticated;

  return (
    <GitHubProvider config={githubConfig}>
      {!isAuthed ? (
        <main className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold">Sign in to manage your GitHub PRs</h1>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/github/login`}
              className="inline-block px-4 py-2 border rounded"
            >
              Continue with GitHub
            </a>
          </div>
        </main>
      ) : (
        <PRManager />
      )}
    </GitHubProvider>
  )
}