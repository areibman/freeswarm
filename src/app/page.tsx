import { AuthenticatedGitHubProvider } from '@/contexts/AuthenticatedGitHubContext'
import { PRManager } from '@/components/PRManager'
import { Navigation } from '@/components/Navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <AuthenticatedGitHubProvider>
            <PRManager />
          </AuthenticatedGitHubProvider>
        </main>
      </div>
    </ProtectedRoute>
  )
}