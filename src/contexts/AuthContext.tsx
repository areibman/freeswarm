"use client"

import { createContext, useContext, ReactNode } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { Session } from 'next-auth'

interface AuthContextValue {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  )
}

function AuthContextInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  
  const signIn = () => {
    window.location.href = '/api/auth/signin'
  }
  
  const signOut = () => {
    window.location.href = '/api/auth/signout'
  }

  const value: AuthContextValue = {
    session,
    status,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}