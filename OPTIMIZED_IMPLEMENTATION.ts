import { NextRequest } from "next/server"

// Modern agent-based architecture for documentation generation
export interface FileAnalysis {
  filePath: string
  summary: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  complexity: number
  functions: FunctionAnalysis[]
  classes: ClassAnalysis[]
  dependencies: string[]
  cacheKey: string
  analysisTime: number
}

export interface ProjectContext {
  name: string
  description?: string
  framework: string
  language: string
  patterns: string[]
}

// Agent 1: File Collector & Categorizer
class FileCollectorAgent {
  async categorizeFiles(files: GitHubFile[]): Promise<Map<string, GitHubFile[]>> {
    const categories = new Map<string, GitHubFile[]>()
    
    for (const file of files) {
      const category = this.determineCategory(file)
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(file)
    }
    
    return categories
  }

  private determineCategory(file: GitHubFile): string {
    const path = file.path.toLowerCase()
    
    // Core application files (highest priority)
    if (path.includes('main.') || path.includes('index.') || path.includes('app.')) {
      return 'core'
    }
    
    // API/Routes (high priority)
    if (path.includes('/api/') || path.includes('/routes/') || path.includes('route.')) {
      return 'api'
    }
    
    // Components (medium priority)
    if (path.includes('/components/') || path.includes('/ui/')) {
      return 'components'
    }
    
    // Configuration (low priority)
    if (path.includes('config') || path.includes('.json') || path.includes('.yaml')) {
      return 'config'
    }
    
    // Utilities (low priority)
    if (path.includes('/utils/') || path.includes('/lib/') || path.includes('/helpers/')) {
      return 'utils'
    }
    
    return 'other'
  }

  async prioritizeFiles(files: GitHubFile[]): Promise<GitHubFile[]> {
    const priorityMap = {
      'core': 100,
      'api': 80,
      'components': 60,
      'utils': 40,
      'config': 20,
      'other': 10
    }
    
    return files.sort((a, b) => {
      const aPriority = priorityMap[this.determineCategory(a) as keyof typeof priorityMap] || 0
      const bPriority = priorityMap[this.determineCategory(b) as keyof typeof priorityMap] || 0
      return bPriority - aPriority
    })
  }
}

// Agent 2: Individual File Analyzer
class FileAnalyzerAgent {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }

  async analyzeFile(file: GitHubFile, context: ProjectContext): Promise<FileAnalysis> {
    // Check cache first
    const cacheKey = this.generateCacheKey(file)
    const cached = await this.getFromCache(cacheKey)
    if (cached) return cached

    const startTime = Date.now()
    
    // Use GPT-4o-mini for fast, cost-effective analysis
    const prompt = this.buildFileAnalysisPrompt(file, context)
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper than GPT-4
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000, // Much smaller than your current 32k
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    const analysis = JSON.parse(response.choices[0]?.message?.content || '{}') as FileAnalysis
    analysis.cacheKey = cacheKey
    analysis.analysisTime = Date.now() - startTime

    // Cache the result
    await this.cacheAnalysis(cacheKey, analysis)
    
    return analysis
  }

  private buildFileAnalysisPrompt(file: GitHubFile, context: ProjectContext): string {
    return `Analyze this ${file.language} file from the ${context.name} project (${context.framework} framework).

File: ${file.path}
Content:
${file.content.slice(0, 8000)} // Truncate large files

Provide a JSON analysis with:
{
  "filePath": "${file.path}",
  "summary": "Brief 2-3 sentence summary",
  "importance": "critical|high|medium|low",
  "complexity": 1-10,
  "functions": [{"name": "", "description": "", "parameters": [], "complexity": ""}],
  "classes": [{"name": "", "description": "", "methods": []}],
  "dependencies": ["list of imports/dependencies"]
}

Focus on practical value for developers. Be concise but thorough.`
  }

  private generateCacheKey(file: GitHubFile): string {
    const contentHash = Buffer.from(file.content).toString('base64').slice(0, 32)
    return `file_${file.path}_${contentHash}`
  }

  private async getFromCache(cacheKey: string): Promise<FileAnalysis | null> {
    // Implement Redis or in-memory cache
    // For now, return null (no cache)
    return null
  }

  private async cacheAnalysis(cacheKey: string, analysis: FileAnalysis): Promise<void> {
    // Implement cache storage
    // Store with TTL of 1 hour
  }
}

// Agent 3: Documentation Compiler
class DocumentationCompilerAgent {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }

  async synthesizeDocumentation(
    analyses: FileAnalysis[], 
    context: ProjectContext,
    onProgress?: (progress: number) => void
  ): Promise<ProjectAnalysis> {
    
    // Group analyses by importance and category
    const groupedAnalyses = this.groupAnalyses(analyses)
    
    // Generate documentation sections in parallel
    const sections = await Promise.all([
      this.generateOverview(groupedAnalyses.critical, context),
      this.generateArchitecture(groupedAnalyses.high, context),
      this.generateApiReference(groupedAnalyses.api, context),
      this.generateGettingStarted(context),
    ])

    onProgress?.(80)

    // Combine sections into final documentation
    const finalDocumentation = await this.combineSection(sections, analyses, context)
    
    onProgress?.(100)
    
    return finalDocumentation
  }

  private groupAnalyses(analyses: FileAnalysis[]): Record<string, FileAnalysis[]> {
    return {
      critical: analyses.filter(a => a.importance === 'critical'),
      high: analyses.filter(a => a.importance === 'high'),
      medium: analyses.filter(a => a.importance === 'medium'),
      low: analyses.filter(a => a.importance === 'low'),
      api: analyses.filter(a => a.filePath.includes('/api/') || a.filePath.includes('route.')),
    }
  }

  private async generateOverview(criticalFiles: FileAnalysis[], context: ProjectContext): Promise<string> {
    const prompt = `Create a compelling project overview for ${context.name}.

Critical files analysis:
${criticalFiles.map(f => `- ${f.filePath}: ${f.summary}`).join('\n')}

Framework: ${context.framework}
Language: ${context.language}

Write a 2-3 paragraph overview that explains what this project does, its key benefits, and why developers would want to use it. Be engaging and professional.`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    })

    return response.choices[0]?.message?.content || ''
  }

  private async generateArchitecture(highPriorityFiles: FileAnalysis[], context: ProjectContext): Promise<string> {
    // Similar focused generation for architecture section
    return 'Architecture section...'
  }

  private async generateApiReference(apiFiles: FileAnalysis[], context: ProjectContext): Promise<string> {
    // Generate API docs from route files
    return 'API reference...'
  }

  private async generateGettingStarted(context: ProjectContext): Promise<string> {
    // Generate getting started guide based on project type
    return 'Getting started...'
  }

  private async combineSection(sections: string[], analyses: FileAnalysis[], context: ProjectContext): Promise<ProjectAnalysis> {
    // Combine all sections into final structured documentation
    return {
      overview: sections[0],
      architecture: sections[1],
      apiReference: sections[2],
      gettingStarted: sections[3],
      projectStructure: this.generateProjectStructure(analyses),
      keyComponents: this.generateKeyComponents(analyses),
      usageExamples: this.generateUsageExamples(analyses, context),
      fileDocumentations: this.convertAnalysesToDocs(analyses)
    }
  }

  private generateProjectStructure(analyses: FileAnalysis[]): string {
    // Generate tree view of project structure
    return 'Project structure...'
  }

  private generateKeyComponents(analyses: FileAnalysis[]): string {
    const criticalComponents = analyses
      .filter(a => a.importance === 'critical' || a.importance === 'high')
      .map(a => `### ${a.filePath}\n${a.summary}\n`)
      .join('\n')
    
    return criticalComponents
  }

  private generateUsageExamples(analyses: FileAnalysis[], context: ProjectContext): string {
    // Generate practical usage examples
    return 'Usage examples...'
  }

  private convertAnalysesToDocs(analyses: FileAnalysis[]): Record<string, any> {
    const docs: Record<string, any> = {}
    
    for (const analysis of analyses) {
      docs[analysis.filePath] = {
        summary: analysis.summary,
        purpose: `Key ${analysis.importance} file in the project`,
        importance: analysis.importance,
        keyFunctions: analysis.functions || [],
        classes: analysis.classes || [],
        dependencies: analysis.dependencies || [],
        codeQuality: {
          readability: 10 - analysis.complexity,
          complexity: analysis.complexity,
          maintainability: 10 - (analysis.complexity / 2)
        }
      }
    }
    
    return docs
  }
}

// Main Orchestrator with Streaming
export class OptimizedDocumentationService {
  private fileCollector: FileCollectorAgent
  private fileAnalyzer: FileAnalyzerAgent
  private documentationCompiler: DocumentationCompilerAgent

  constructor(openai: OpenAI) {
    this.fileCollector = new FileCollectorAgent()
    this.fileAnalyzer = new FileAnalyzerAgent(openai)
    this.documentationCompiler = new DocumentationCompilerAgent(openai)
  }

  async generateDocumentationStream(
    files: GitHubFile[],
    repositoryInfo: RepositoryInfo,
    onProgress: (event: ProgressEvent) => void
  ): Promise<ProjectAnalysis> {
    
    onProgress({ type: 'started', message: 'Categorizing files...', progress: 0 })
    
    // Step 1: Categorize and prioritize files (fast)
    const categorizedFiles = await this.fileCollector.categorizeFiles(files)
    const prioritizedFiles = await this.fileCollector.prioritizeFiles(files)
    
    onProgress({ type: 'categorized', message: `Categorized ${files.length} files`, progress: 10 })

    // Step 2: Analyze files in parallel batches (concurrent)
    const analyses: FileAnalysis[] = []
    const batchSize = 5 // Process 5 files concurrently
    
    for (let i = 0; i < prioritizedFiles.length; i += batchSize) {
      const batch = prioritizedFiles.slice(i, i + batchSize)
      
      const batchPromises = batch.map(file => 
        this.fileAnalyzer.analyzeFile(file, {
          name: repositoryInfo.name,
          description: repositoryInfo.description || '',
          framework: this.detectFramework(files),
          language: repositoryInfo.language || 'unknown',
          patterns: []
        })
      )

      const batchResults = await Promise.all(batchPromises)
      analyses.push(...batchResults)

      const progress = 10 + ((i + batch.length) / prioritizedFiles.length) * 60
      onProgress({ 
        type: 'analyzing', 
        message: `Analyzed ${analyses.length}/${prioritizedFiles.length} files`, 
        progress 
      })
    }

    onProgress({ type: 'compiling', message: 'Generating documentation...', progress: 70 })

    // Step 3: Compile documentation
    const documentation = await this.documentationCompiler.synthesizeDocumentation(
      analyses,
      {
        name: repositoryInfo.name,
        description: repositoryInfo.description || '',
        framework: this.detectFramework(files),
        language: repositoryInfo.language || 'unknown',
        patterns: []
      },
      (compilerProgress) => {
        const overallProgress = 70 + (compilerProgress * 0.3)
        onProgress({ 
          type: 'compiling', 
          message: 'Finalizing documentation...', 
          progress: overallProgress 
        })
      }
    )

    onProgress({ type: 'completed', message: 'Documentation generated successfully!', progress: 100 })

    return documentation
  }

  private detectFramework(files: GitHubFile[]): string {
    // Detect framework from package.json, file structure, etc.
    const packageJson = files.find(f => f.name === 'package.json')
    if (packageJson) {
      const content = JSON.parse(packageJson.content)
      if (content.dependencies?.['next']) return 'Next.js'
      if (content.dependencies?.['react']) return 'React'
      if (content.dependencies?.['vue']) return 'Vue.js'
      if (content.dependencies?.['express']) return 'Express.js'
    }
    
    return 'Unknown'
  }
}

export interface ProgressEvent {
  type: 'started' | 'categorized' | 'analyzing' | 'compiling' | 'completed'
  message: string
  progress: number
}

// Usage in your API route
export async function POST(request: NextRequest) {
  // ... existing auth logic ...

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const service = new OptimizedDocumentationService(openai)

  // Set up Server-Sent Events for real-time progress
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      service.generateDocumentationStream(
        codeFiles,
        repositoryInfo,
        (event) => {
          // Send progress updates to client
          const data = `data: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(data))
        }
      ).then((documentation) => {
        // Send final result
        const finalData = `data: ${JSON.stringify({ type: 'result', documentation })}\n\n`
        controller.enqueue(encoder.encode(finalData))
        controller.close()
      }).catch((error) => {
        const errorData = `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
