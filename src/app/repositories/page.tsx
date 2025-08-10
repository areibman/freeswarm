import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RepositoryConnection } from '@/components/RepositoryConnection'
import { Navigation } from '@/components/Navigation'

export default function RepositoriesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <RepositoryConnection />
        </main>
      </div>
    </ProtectedRoute>
  )
}