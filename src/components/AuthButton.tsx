import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <button className="px-4 py-2 bg-gray-300 rounded" disabled>Loading...</button>
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('github')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sign in with GitHub
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{session.user?.name || session.user?.email}</span>
      <button
        onClick={() => signOut()}
        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Sign out
      </button>
    </div>
  )
}