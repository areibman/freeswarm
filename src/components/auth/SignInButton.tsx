"use client"

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'

interface SignInButtonProps {
  className?: string
  children?: React.ReactNode
}

export function SignInButton({ className, children }: SignInButtonProps) {
  const { signIn, loading } = useAuth()

  const handleSignIn = async () => {
    await signIn()
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading}
      className={className}
      variant="default"
    >
      <Github className="w-4 h-4 mr-2" />
      {children || 'Sign in with GitHub'}
    </Button>
  )
}