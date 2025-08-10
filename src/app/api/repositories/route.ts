import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    // Fetch repositories from GitHub API
    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'FreeSwarm-PR-Manager/1.0',
      },
    })

    if (!response.ok) {
      console.error('GitHub API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch repositories from GitHub' },
        { status: response.status }
      )
    }

    const repos = await response.json()

    // Transform the data to match our interface
    const transformedRepos = repos.map((repo: {
      id: number
      name: string
      full_name: string
      owner: { login: string }
      private: boolean
      description: string | null
      default_branch: string
      html_url: string
    }) => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      description: repo.description,
      defaultBranch: repo.default_branch,
      url: repo.html_url,
    }))

    return NextResponse.json(transformedRepos)
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}