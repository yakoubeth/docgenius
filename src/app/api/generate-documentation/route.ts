import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import ClaudeService, { type CodeAnalysisRequest } from "@/lib/claude-service"

interface GenerateDocumentationRequest {
  repositoryId: number
  repositoryName: string
  repositoryFullName: string
  files?: string[] // Optional: specific files to analyze
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    const body: GenerateDocumentationRequest = await request.json()
    const { repositoryId, repositoryName, repositoryFullName, files } = body

    if (!repositoryId || !repositoryName || !repositoryFullName) {
      return NextResponse.json(
        { error: "Missing required repository information" },
        { status: 400 }
      )
    }

    // Step 1: Get repository contents from GitHub
    const repoContents = await fetchRepositoryContents(
      session.accessToken,
      repositoryFullName,
      files
    )

    if (repoContents.length === 0) {
      return NextResponse.json(
        { error: "No suitable files found for documentation generation" },
        { status: 404 }
      )
    }

    // Step 2: Analyze code with Claude
    const claudeService = ClaudeService.getInstance()
    const codeAnalysisRequests: CodeAnalysisRequest[] = repoContents.map(file => ({
      fileContent: file.content,
      fileName: file.name,
      language: getLanguageFromFileName(file.name),
      projectContext: `Repository: ${repositoryName}\nDescription: ${file.description || 'No description available'}`
    }))

    // Step 3: Generate documentation
    const documentation = await claudeService.generateProjectDocumentation(codeAnalysisRequests)

    // Step 4: Format the documentation as Markdown
    const markdownDocumentation = formatDocumentationAsMarkdown(
      repositoryName,
      repositoryFullName,
      documentation
    )

    return NextResponse.json({
      success: true,
      repository: {
        id: repositoryId,
        name: repositoryName,
        fullName: repositoryFullName
      },
      documentation: {
        markdown: markdownDocumentation,
        structured: documentation
      },
      filesAnalyzed: repoContents.length,
      generatedAt: new Date().toISOString()
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

async function fetchRepositoryContents(
  accessToken: string,
  repositoryFullName: string,
  specificFiles?: string[]
): Promise<Array<{ name: string; content: string; description?: string }>> {
  const contents: Array<{ name: string; content: string; description?: string }> = []

  try {
    // Get repository contents
    const response = await fetch(
      `https://api.github.com/repos/${repositoryFullName}/contents`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "DocuGenius",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch repository contents: ${response.statusText}`)
    }

    const repoContents = await response.json()
    
    // Filter for code files
    const codeFiles = repoContents.filter((item: any) => {
      const fileName = item.name.toLowerCase()
      const isCodeFile = (
        fileName.endsWith('.js') ||
        fileName.endsWith('.ts') ||
        fileName.endsWith('.jsx') ||
        fileName.endsWith('.tsx') ||
        fileName.endsWith('.py') ||
        fileName.endsWith('.java') ||
        fileName.endsWith('.go') ||
        fileName.endsWith('.rs') ||
        fileName.endsWith('.cpp') ||
        fileName.endsWith('.c') ||
        fileName.endsWith('.cs') ||
        fileName.endsWith('.php') ||
        fileName.endsWith('.rb') ||
        fileName.endsWith('.swift') ||
        fileName.endsWith('.kt') ||
        fileName.endsWith('.dart') ||
        fileName.endsWith('.vue') ||
        fileName.endsWith('.svelte')
      )
      
      // If specific files are requested, filter by those
      if (specificFiles && specificFiles.length > 0) {
        return isCodeFile && specificFiles.includes(item.name)
      }
      
      return isCodeFile && item.type === 'file'
    })

    // Fetch content for each code file (limit to first 10 files to avoid API limits)
    const filesToAnalyze = codeFiles.slice(0, 10)
    
    for (const file of filesToAnalyze) {
      try {
        const fileResponse = await fetch(file.download_url)
        if (fileResponse.ok) {
          const content = await fileResponse.text()
          
          // Skip very large files (> 50KB) to avoid token limits
          if (content.length <= 50000) {
            contents.push({
              name: file.name,
              content: content
            })
          }
        }
      } catch (fileError) {
        console.error(`Failed to fetch content for ${file.name}:`, fileError)
        // Continue with other files
      }
    }

  } catch (error) {
    console.error("Error fetching repository contents:", error)
    throw error
  }

  return contents
}

function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
    'vue': 'vue',
    'svelte': 'svelte'
  }
  
  return languageMap[extension || ''] || 'text'
}

function formatDocumentationAsMarkdown(
  repositoryName: string,
  repositoryFullName: string,
  documentation: any
): string {
  let markdown = `# ${repositoryName} Documentation\n\n`
  markdown += `> Generated by DocuGenius for [${repositoryFullName}](https://github.com/${repositoryFullName})\n\n`
  markdown += `*Generated on: ${new Date().toLocaleDateString()}*\n\n`
  markdown += `---\n\n`
  
  // Project Overview
  markdown += `## Project Overview\n\n`
  markdown += `${documentation.overview}\n\n`
  
  // Getting Started
  markdown += documentation.gettingStarted
  markdown += `\n`
  
  // API Reference
  markdown += documentation.apiReference
  markdown += `\n`
  
  // File-by-file documentation
  markdown += `## File Documentation\n\n`
  Object.entries(documentation.fileDocumentations).forEach(([fileName, doc]: [string, any]) => {
    markdown += `### ${fileName}\n\n`
    markdown += `${doc.summary}\n\n`
    
    if (doc.functions.length > 0) {
      markdown += `#### Functions\n\n`
      doc.functions.forEach((func: any) => {
        markdown += `##### \`${func.name}\`\n\n`
        markdown += `${func.description}\n\n`
        
        if (func.parameters.length > 0) {
          markdown += `**Parameters:**\n\n`
          func.parameters.forEach((param: any) => {
            markdown += `- \`${param.name}\` (\`${param.type}\`) - ${param.description}\n`
          })
          markdown += `\n`
        }
        
        markdown += `**Returns:** \`${func.returns.type}\` - ${func.returns.description}\n\n`
        
        if (func.examples && func.examples.length > 0) {
          markdown += `**Example:**\n\n`
          func.examples.forEach((example: string) => {
            markdown += `\`\`\`javascript\n${example}\n\`\`\`\n\n`
          })
        }
      })
    }
    
    if (doc.classes.length > 0) {
      markdown += `#### Classes\n\n`
      doc.classes.forEach((cls: any) => {
        markdown += `##### \`${cls.name}\`\n\n`
        markdown += `${cls.description}\n\n`
        
        if (cls.properties.length > 0) {
          markdown += `**Properties:**\n\n`
          cls.properties.forEach((prop: any) => {
            markdown += `- \`${prop.name}\` (\`${prop.type}\`) - ${prop.description}\n`
          })
          markdown += `\n`
        }
        
        if (cls.methods.length > 0) {
          markdown += `**Methods:**\n\n`
          cls.methods.forEach((method: any) => {
            markdown += `###### \`${method.name}\`\n\n`
            markdown += `${method.description}\n\n`
            
            if (method.parameters.length > 0) {
              markdown += `**Parameters:**\n\n`
              method.parameters.forEach((param: any) => {
                markdown += `- \`${param.name}\` (\`${param.type}\`) - ${param.description}\n`
              })
              markdown += `\n`
            }
            
            markdown += `**Returns:** \`${method.returns.type}\` - ${method.returns.description}\n\n`
          })
        }
      })
    }
    
    if (doc.constants.length > 0) {
      markdown += `#### Constants\n\n`
      doc.constants.forEach((constant: any) => {
        markdown += `##### \`${constant.name}\`\n\n`
        markdown += `- **Type:** \`${constant.type}\`\n`
        if (constant.value) {
          markdown += `- **Value:** \`${constant.value}\`\n`
        }
        markdown += `- **Description:** ${constant.description}\n\n`
      })
    }
    
    markdown += `---\n\n`
  })
  
  return markdown
}
