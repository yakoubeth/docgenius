import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { OptimizedDocumentationService } from "@/lib/optimized-documentation-service"
import RepositoryAnalyzer from "@/lib/repository-analyzer"
import { DocumentationService } from "@/lib/database"
import OpenAI from 'openai'

interface GenerateDocumentationRequest {
  repositoryId: number
  repositoryName: string
  repositoryFullName: string
  files?: string[]
}

// Regular POST endpoint for non-streaming requests
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized - No session or access token" }, 
        { status: 401 }
      )
    }

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

    // Initialize services
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
    
    const analyzer = new RepositoryAnalyzer(session.accessToken)
    const optimizedService = new OptimizedDocumentationService(openai)

    // Get repository info and files
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

    // Generate documentation with the optimized service
    let progress = 0
    const analysis = await optimizedService.generateDocumentationStream(
      allFiles,
      repositoryInfo,
      (event) => {
        progress = event.progress
        console.log(`Progress: ${event.progress}% - ${event.message}`)
      }
    )

    // Generate markdown using existing service
    const openaiService = await import('@/lib/openai-service')
    const openaiInstance = openaiService.default.getInstance()
    const markdownDocumentation = await openaiInstance.generateMarkdownDocumentation(
      analysis,
      repositoryInfo.name,
      repositoryInfo.fullName,
      allFiles.length
    )

    // Save to database
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
      saved: true,
      optimized: true, // Flag to indicate this used the new optimized service
      performance: {
        totalFiles: allFiles.length,
        finalProgress: progress
      }
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

// Streaming endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return new Response("Unauthorized", { status: 401 })
    }

    const userId = session.user?.id || session.user?.githubId
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    const url = new URL(request.url)
    const repositoryId = url.searchParams.get('repositoryId')
    const repositoryFullName = url.searchParams.get('repositoryFullName')

    if (!repositoryId || !repositoryFullName) {
      return new Response("Missing required parameters", { status: 400 })
    }

    const [owner, repo] = repositoryFullName.split('/')
    if (!owner || !repo) {
      return new Response("Invalid repository format", { status: 400 })
    }

    // Set up streaming response
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (data: any) => {
          const event = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(event))
        }

        const generateDocumentation = async () => {
          try {
            // Initialize services
            const openai = new OpenAI({
              apiKey: process.env.OPENAI_API_KEY!,
            })
            
            const analyzer = new RepositoryAnalyzer(session.accessToken!)
            const optimizedService = new OptimizedDocumentationService(openai)

            // Get repository info and files
            sendEvent({ type: 'progress', message: 'Fetching repository data...', progress: 0 })
            
            const [repositoryInfo, allFiles] = await Promise.all([
              analyzer.getRepositoryInfo(owner, repo),
              analyzer.getAllRepositoryFiles(owner, repo)
            ])

            if (allFiles.length === 0) {
              sendEvent({ type: 'error', message: 'No suitable files found', progress: 0 })
              controller.close()
              return
            }

            // Generate documentation with real-time progress
            const analysis = await optimizedService.generateDocumentationStream(
              allFiles,
              repositoryInfo,
              (event) => {
                sendEvent({
                  type: 'progress',
                  message: event.message,
                  progress: event.progress,
                  stage: event.type
                })
              }
            )

            // Generate markdown
            sendEvent({ type: 'progress', message: 'Generating markdown...', progress: 90 })
            
            const openaiService = await import('@/lib/openai-service')
            const openaiInstance = openaiService.default.getInstance()
            const markdownDocumentation = await openaiInstance.generateMarkdownDocumentation(
              analysis,
              repositoryInfo.name,
              repositoryInfo.fullName,
              allFiles.length
            )

            // Save to database
            sendEvent({ type: 'progress', message: 'Saving documentation...', progress: 95 })
            
            const savedDocumentation = await DocumentationService.saveDocumentation(
              userId,
              {
                id: parseInt(repositoryId),
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

            // Send final result
            sendEvent({
              type: 'complete',
              message: 'Documentation generated successfully!',
              progress: 100,
              data: {
                success: true,
                repository: {
                  id: parseInt(repositoryId),
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
                saved: true,
                optimized: true
              }
            })

            controller.close()

          } catch (error) {
            console.error('Streaming documentation generation error:', error)
            sendEvent({
              type: 'error',
              message: error instanceof Error ? error.message : 'Unknown error',
              progress: 0
            })
            controller.close()
          }
        }

        generateDocumentation()
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error("Streaming endpoint error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
