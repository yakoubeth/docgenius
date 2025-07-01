import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  ssh_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  size: number
  created_at: string
  updated_at: string
  pushed_at: string
  default_branch: string
  topics: string[]
  owner: {
    login: string
    avatar_url: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get("page") || "1"
    const perPage = searchParams.get("per_page") || "30"
    const sort = searchParams.get("sort") || "updated"
    const type = searchParams.get("type") || "owner"

    const response = await fetch(
      `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=${sort}&type=${type}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DocuGenius",
        },
      }
    )

    if (!response.ok) {
      console.error("GitHub API error:", response.status, response.statusText)
      return NextResponse.json(
        { error: "Failed to fetch repositories" },
        { status: response.status }
      )
    }

    const repositories: GitHubRepository[] = await response.json()

    // Transform the data to include only what we need
    const transformedRepos = repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      size: repo.size,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      default_branch: repo.default_branch,
      topics: repo.topics || [],
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
    }))

    // Get total count from headers if available
    const linkHeader = response.headers.get("link")
    let totalCount = repositories.length
    
    if (linkHeader) {
      const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/)
      if (lastPageMatch) {
        totalCount = parseInt(lastPageMatch[1]) * parseInt(perPage)
      }
    }

    return NextResponse.json({
      repositories: transformedRepos,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(perPage),
        total: totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
