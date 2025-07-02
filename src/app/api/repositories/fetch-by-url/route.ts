import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { owner, repo } = await request.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo name are required' }, { status: 400 })
    }

    // Fetch repository data from GitHub API
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
      }
      if (response.status === 403) {
        return NextResponse.json({ error: 'Access denied. Repository may be private.' }, { status: 403 })
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repoData = await response.json()

    // Transform the data to match our Repository interface
    const repository = {
      id: repoData.id,
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      private: repoData.private,
      html_url: repoData.html_url,
      language: repoData.language,
      stargazers_count: repoData.stargazers_count,
      forks_count: repoData.forks_count,
      updated_at: repoData.updated_at,
      topics: repoData.topics || [],
      owner: {
        login: repoData.owner.login,
        avatar_url: repoData.owner.avatar_url,
      },
    }

    return NextResponse.json(repository)
  } catch (error) {
    console.error('Error fetching repository:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 }
    )
  }
}
