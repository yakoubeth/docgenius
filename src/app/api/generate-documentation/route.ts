import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import OpenAIService, { type CodeFile, type ProjectAnalysis } from "@/lib/openai-service"
import RepositoryAnalyzer from "@/lib/repository-analyzer"
import { DocumentationService } from "@/lib/database"

interface GenerateDocumentationRequest {
  repositoryId: number
  repositoryName: string
  repositoryFullName: string
  files?: string[] // Optional: specific files to analyze
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Debug logging
    console.log("Session debug:", {
      hasSession: !!session,
      accessToken: !!session?.accessToken,
      user: session?.user,
      userId: session?.user?.id,
      githubId: session?.user?.githubId
    })
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No session or access token" }, 
        { status: 401 }
      )
    }

    // Use githubId as fallback if user.id is not set
    const userId = session.user?.id || session.user?.githubId
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No user ID available" }, 
        { status: 401 }
      )
    }

    const body: GenerateDocumentationRequest = await request.json()
    const { repositoryId, repositoryName, repositoryFullName } = body

    if (!repositoryId || !repositoryName || !repositoryFullName) {
      return NextResponse.json(
        { error: "Missing required repository information" },
        { status: 400 }
      )
    }

    // Parse owner and repo from full name
    const [owner, repo] = repositoryFullName.split('/')
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Invalid repository full name format" },
        { status: 400 }
      )
    }

    // Step 1: Get ALL repository files
    const analyzer = new RepositoryAnalyzer(session.accessToken)
    const [repositoryInfo, allFiles] = await Promise.all([
      analyzer.getRepositoryInfo(owner, repo),
      analyzer.getAllRepositoryFiles(owner, repo)
    ])

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "No suitable files found for documentation generation" },
        { status: 404 }
      )
    }

    // Step 2: Convert to CodeFile format
    const codeFiles: CodeFile[] = allFiles.map(file => ({
      name: file.name,
      content: file.content,
      path: file.path,
      language: file.language,
      size: file.size
    }))

    // Step 3: Analyze codebase with OpenAI
    const openaiService = OpenAIService.getInstance()
    const analysis: ProjectAnalysis = await openaiService.analyzeCodebase(
      codeFiles,
      repositoryInfo.name,
      repositoryInfo.description || undefined
    )

    // Step 4: Generate Markdown documentation
    const markdownDocumentation = await openaiService.generateMarkdownDocumentation(
      analysis,
      repositoryInfo.name,
      repositoryInfo.fullName,
      allFiles.length
    )

    // Step 5: Save to database
    const savedDocumentation = await DocumentationService.saveDocumentation(
      userId,
      {
        id: repositoryId,
        name: repositoryInfo.name,
        fullName: repositoryInfo.fullName,
        description: repositoryInfo.description,
        language: repositoryInfo.language,
        topics: repositoryInfo.topics,
        htmlUrl: `https://github.com/${repositoryInfo.fullName}`,
      },
      {
        title: `${repositoryInfo.name} Documentation`,
        markdownContent: markdownDocumentation,
        structuredData: analysis as unknown as Record<string, unknown>,
        filesAnalyzed: allFiles.length,
      }
    )

    return NextResponse.json({
      success: true,
      repository: {
        id: repositoryId,
        name: repositoryInfo.name,
        fullName: repositoryInfo.fullName
      },
      documentation: {
        id: savedDocumentation.id,
        markdown: markdownDocumentation,
        structured: analysis
      },
      filesAnalyzed: allFiles.length,
      generatedAt: new Date().toISOString(),
      saved: true
    })

  } catch (error) {
    console.error("Error generating documentation:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
