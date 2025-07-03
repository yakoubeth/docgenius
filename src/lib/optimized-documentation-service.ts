import OpenAI from 'openai'
import { NextRequest } from "next/server"

// Enhanced type definitions
export interface FunctionAnalysis {
  name: string
  description: string
  parameters: Array<{ name: string; type: string; description: string }>
  complexity: 'simple' | 'moderate' | 'complex'
  returns?: { type: string; description: string }
}

export interface ClassAnalysis {
  name: string
  description: string
  methods: Array<{
    name: string
    description: string
    parameters: Array<{ name: string; type: string; description: string }>
    returns: { type: string; description: string }
    visibility?: 'public' | 'private' | 'protected'
  }>
}

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

export interface GitHubFile {
  name: string
  path: string
  content: string
  language: string
  size: number
  sha: string
}

export interface RepositoryInfo {
  name: string
  fullName: string
  description: string | null
  language: string | null
  topics: string[]
  defaultBranch: string
}

export interface ProjectAnalysis {
  overview: string
  architecture: string
  gettingStarted: string
  apiReference: string
  projectStructure: string
  keyComponents: string
  usageExamples: string
  highlights?: {
    keyFeatures: string[]
    technologies: string[]
    useCases: string[]
    benefits: string[]
  }
  metrics?: {
    complexity: 'Low' | 'Medium' | 'High'
    maintainability: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement'
    testCoverage: string
    performance: string
  }
  fileDocumentations: Record<string, any>
}

export interface ProgressEvent {
  type: 'started' | 'categorized' | 'analyzing' | 'compiling' | 'completed' | 'error'
  message: string
  progress: number
  data?: any
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
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Faster and cheaper than GPT-4
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000, // Much smaller than your current 32k
        temperature: 0.1,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      const analysis = JSON.parse(content) as FileAnalysis
      analysis.cacheKey = cacheKey
      analysis.analysisTime = Date.now() - startTime

      // Cache the result
      await this.cacheAnalysis(cacheKey, analysis)
      
      return analysis
    } catch (error) {
      console.error(`Error analyzing file ${file.path}:`, error)
      
      // Return a fallback analysis
      return {
        filePath: file.path,
        summary: `${file.language} file - analysis failed`,
        importance: 'low' as const,
        complexity: 5,
        functions: [],
        classes: [],
        dependencies: [],
        cacheKey,
        analysisTime: Date.now() - startTime
      }
    }
  }

  private buildFileAnalysisPrompt(file: GitHubFile, context: ProjectContext): string {
    // Truncate content to prevent token overflow
    const truncatedContent = file.content.length > 8000 
      ? file.content.slice(0, 8000) + '\n... (truncated)'
      : file.content

    return `Analyze this ${file.language} file from the ${context.name} project.

File: ${file.path}
Framework: ${context.framework}
Content:
${truncatedContent}

Provide a JSON analysis with this exact structure:
{
  "filePath": "${file.path}",
  "summary": "Brief 2-3 sentence summary of what this file does",
  "importance": "critical|high|medium|low",
  "complexity": 1-10,
  "functions": [
    {
      "name": "functionName",
      "description": "What this function does",
      "parameters": [{"name": "param", "type": "string", "description": "param description"}],
      "complexity": "simple|moderate|complex"
    }
  ],
  "classes": [
    {
      "name": "ClassName",
      "description": "What this class does",
      "methods": [{"name": "method", "description": "method description", "parameters": [], "returns": {"type": "void", "description": ""}}]
    }
  ],
  "dependencies": ["array", "of", "imported", "modules"]
}

Focus on practical value for developers. Be concise but accurate.`
  }

  private generateCacheKey(file: GitHubFile): string {
    // Create a hash based on file path and content
    const contentHash = Buffer.from(file.content.slice(0, 1000)).toString('base64').slice(0, 16)
    return `file_${file.path.replace(/[^a-zA-Z0-9]/g, '_')}_${contentHash}`
  }

  private async getFromCache(cacheKey: string): Promise<FileAnalysis | null> {
    // TODO: Implement Redis or database cache
    // For now, return null (no cache)
    return null
  }

  private async cacheAnalysis(cacheKey: string, analysis: FileAnalysis): Promise<void> {
    // TODO: Implement cache storage
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
    
    onProgress?.(75)

    // Generate documentation sections with smaller, focused prompts
    const [overview, architecture, apiReference, gettingStarted] = await Promise.all([
      this.generateOverview(groupedAnalyses.critical, context),
      this.generateArchitecture(groupedAnalyses.high, context),
      this.generateApiReference(groupedAnalyses.api, context),
      this.generateGettingStarted(context),
    ])

    onProgress?.(90)

    // Combine sections into final documentation
    const finalDocumentation: ProjectAnalysis = {
      overview,
      architecture,
      apiReference,
      gettingStarted,
      projectStructure: this.generateProjectStructure(analyses),
      keyComponents: this.generateKeyComponents(analyses),
      usageExamples: this.generateUsageExamples(analyses, context),
      fileDocumentations: this.convertAnalysesToDocs(analyses),
      highlights: {
        keyFeatures: this.extractKeyFeatures(analyses),
        technologies: this.extractTechnologies(analyses, context),
        useCases: this.generateUseCases(context),
        benefits: this.generateBenefits(analyses, context)
      },
      metrics: {
        complexity: this.calculateComplexity(analyses),
        maintainability: this.assessMaintainability(analyses),
        testCoverage: this.assessTestCoverage(analyses),
        performance: this.assessPerformance(analyses)
      }
    }
    
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
    if (criticalFiles.length === 0) {
      return `${context.name} is a ${context.framework} application built with ${context.language}. This project provides functionality through a well-structured codebase with multiple components working together to deliver a cohesive user experience.`
    }

    const prompt = `Create a compelling project overview for ${context.name}, a ${context.framework} application.

Key files:
${criticalFiles.slice(0, 5).map(f => `- ${f.filePath}: ${f.summary}`).join('\n')}

Framework: ${context.framework}
Language: ${context.language}

Write 2-3 paragraphs explaining:
1. What this project does and its main purpose
2. Key benefits and why developers would use it
3. What makes it special or unique

Be engaging but professional. Focus on practical value.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.3
      })

      return response.choices[0]?.message?.content || `${context.name} - A ${context.framework} application.`
    } catch (error) {
      console.error('Error generating overview:', error)
      return `${context.name} is a modern ${context.framework} application that provides robust functionality through a well-architected codebase.`
    }
  }

  private async generateArchitecture(highPriorityFiles: FileAnalysis[], context: ProjectContext): Promise<string> {
    const architecturePrompt = `Describe the architecture of ${context.name} (${context.framework}).

Key components:
${highPriorityFiles.slice(0, 8).map(f => `- ${f.filePath}: ${f.summary}`).join('\n')}

Explain:
1. Overall architecture pattern
2. How components interact
3. Data flow
4. Key design decisions

Keep it concise and developer-focused.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: architecturePrompt }],
        max_tokens: 1000,
        temperature: 0.2
      })

      return response.choices[0]?.message?.content || 'Architecture information not available.'
    } catch (error) {
      console.error('Error generating architecture:', error)
      return `${context.name} follows a modern ${context.framework} architecture with well-separated concerns and modular design.`
    }
  }

  private async generateApiReference(apiFiles: FileAnalysis[], context: ProjectContext): Promise<string> {
    if (apiFiles.length === 0) {
      return 'No API endpoints found in this project.'
    }

    const apiEndpoints = apiFiles.map(file => {
      const functions = file.functions || []
      return `### ${file.filePath}\n${file.summary}\n\n${functions.map(f => `- **${f.name}**: ${f.description}`).join('\n')}`
    }).join('\n\n')

    return `## API Endpoints\n\n${apiEndpoints}`
  }

  private generateGettingStarted(context: ProjectContext): string {
    const frameworkCommands = {
      'Next.js': ['npm install', 'npm run dev'],
      'React': ['npm install', 'npm start'],
      'Vue.js': ['npm install', 'npm run serve'],
      'Express.js': ['npm install', 'npm start'],
      'Unknown': ['npm install', 'npm start']
    }

    const commands = frameworkCommands[context.framework as keyof typeof frameworkCommands] || frameworkCommands.Unknown

    return `## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ${context.name.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

2. Install dependencies:
\`\`\`bash
${commands[0]}
\`\`\`

3. Start the development server:
\`\`\`bash
${commands[1]}
\`\`\`

The application will be available at \`http://localhost:3000\` (or the port specified in your configuration).

### Environment Setup
Make sure to configure any necessary environment variables by copying \`.env.example\` to \`.env.local\` and filling in the required values.`
  }

  private generateProjectStructure(analyses: FileAnalysis[]): string {
    const filesByDirectory: Record<string, string[]> = {}
    
    analyses.forEach(analysis => {
      const dir = analysis.filePath.includes('/') 
        ? analysis.filePath.substring(0, analysis.filePath.lastIndexOf('/'))
        : '.'
      
      if (!filesByDirectory[dir]) {
        filesByDirectory[dir] = []
      }
      filesByDirectory[dir].push(analysis.filePath.split('/').pop() || analysis.filePath)
    })

    let structure = '```\n'
    Object.entries(filesByDirectory)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([dir, files]) => {
        if (dir !== '.') {
          structure += `${dir}/\n`
        }
        files.slice(0, 10).forEach(file => {
          structure += `  ${file}\n`
        })
        if (files.length > 10) {
          structure += `  ... and ${files.length - 10} more files\n`
        }
      })
    structure += '```\n\n'
    
    return structure + 'This project follows a well-organized structure with clear separation of concerns.'
  }

  private generateKeyComponents(analyses: FileAnalysis[]): string {
    const keyComponents = analyses
      .filter(a => a.importance === 'critical' || a.importance === 'high')
      .slice(0, 8)
      .map(a => `### ${a.filePath}\n\n${a.summary}\n\n**Importance**: ${a.importance}\n**Complexity**: ${a.complexity}/10`)
      .join('\n\n')
    
    return keyComponents || 'Key components analysis not available.'
  }

  private generateUsageExamples(analyses: FileAnalysis[], context: ProjectContext): string {
    const exampleFunctions = analyses
      .flatMap(a => a.functions || [])
      .filter(f => f.complexity === 'simple')
      .slice(0, 3)

    if (exampleFunctions.length === 0) {
      return `## Usage Examples

This ${context.framework} application provides various functionality through its components. Refer to the individual file documentation for specific usage patterns and examples.`
    }

    let examples = '## Usage Examples\n\n'
    exampleFunctions.forEach(func => {
      examples += `### ${func.name}\n\n${func.description}\n\n`
      if (func.parameters && func.parameters.length > 0) {
        examples += `**Parameters:**\n`
        func.parameters.forEach(param => {
          examples += `- \`${param.name}\` (${param.type}): ${param.description}\n`
        })
        examples += '\n'
      }
    })

    return examples
  }

  private convertAnalysesToDocs(analyses: FileAnalysis[]): Record<string, any> {
    const docs: Record<string, any> = {}
    
    for (const analysis of analyses) {
      docs[analysis.filePath] = {
        summary: analysis.summary,
        purpose: `${analysis.importance.charAt(0).toUpperCase() + analysis.importance.slice(1)} component in the project architecture`,
        importance: analysis.importance.charAt(0).toUpperCase() + analysis.importance.slice(1),
        keyFunctions: analysis.functions || [],
        classes: analysis.classes || [],
        dependencies: analysis.dependencies || [],
        codeQuality: {
          readability: Math.max(1, 10 - Math.floor(analysis.complexity / 2)),
          complexity: analysis.complexity,
          maintainability: Math.max(1, 10 - Math.floor(analysis.complexity / 3))
        }
      }
    }
    
    return docs
  }

  private extractKeyFeatures(analyses: FileAnalysis[]): string[] {
    const features: Set<string> = new Set()
    
    // Extract from critical and high importance files
    analyses
      .filter(a => ['critical', 'high'].includes(a.importance))
      .forEach(a => {
        if (a.filePath.includes('/api/')) features.add('RESTful API')
        if (a.filePath.includes('/auth/')) features.add('Authentication System')
        if (a.filePath.includes('database') || a.filePath.includes('db')) features.add('Database Integration')
        if (a.filePath.includes('/components/')) features.add('Reusable Components')
        if (a.functions && a.functions.length > 0) features.add('Modular Functions')
      })
    
    return Array.from(features).slice(0, 6)
  }

  private extractTechnologies(analyses: FileAnalysis[], context: ProjectContext): string[] {
    const technologies: Set<string> = new Set([context.framework, context.language])
    
    analyses.forEach(a => {
      a.dependencies?.forEach(dep => {
        if (dep.includes('react')) technologies.add('React')
        if (dep.includes('next')) technologies.add('Next.js')
        if (dep.includes('express')) technologies.add('Express.js')
        if (dep.includes('prisma')) technologies.add('Prisma ORM')
        if (dep.includes('auth')) technologies.add('Authentication')
        if (dep.includes('typescript')) technologies.add('TypeScript')
      })
    })
    
    return Array.from(technologies).slice(0, 8)
  }

  private generateUseCases(context: ProjectContext): string[] {
    const useCases = [
      `${context.framework} application development`,
      'Code documentation and analysis',
      'Developer workflow automation'
    ]
    
    if (context.framework.includes('Next')) {
      useCases.push('Full-stack web applications', 'Server-side rendering')
    }
    
    return useCases.slice(0, 5)
  }

  private generateBenefits(analyses: FileAnalysis[], context: ProjectContext): string[] {
    return [
      'Well-structured and maintainable codebase',
      `Modern ${context.framework} architecture`,
      'Comprehensive error handling',
      'Developer-friendly implementation',
      'Scalable and extensible design'
    ]
  }

  private calculateComplexity(analyses: FileAnalysis[]): 'Low' | 'Medium' | 'High' {
    const avgComplexity = analyses.reduce((sum, a) => sum + a.complexity, 0) / analyses.length
    if (avgComplexity <= 4) return 'Low'
    if (avgComplexity <= 7) return 'Medium'
    return 'High'
  }

  private assessMaintainability(analyses: FileAnalysis[]): 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' {
    const criticalFiles = analyses.filter(a => a.importance === 'critical')
    const avgComplexity = criticalFiles.length > 0 
      ? criticalFiles.reduce((sum, a) => sum + a.complexity, 0) / criticalFiles.length
      : 5
    
    if (avgComplexity <= 3) return 'Excellent'
    if (avgComplexity <= 5) return 'Good'
    if (avgComplexity <= 7) return 'Fair'
    return 'Needs Improvement'
  }

  private assessTestCoverage(analyses: FileAnalysis[]): string {
    const hasTests = analyses.some(a => 
      a.filePath.includes('test') || 
      a.filePath.includes('spec') ||
      a.filePath.includes('__tests__')
    )
    
    return hasTests ? 'Tests detected in codebase' : 'No test files detected'
  }

  private assessPerformance(analyses: FileAnalysis[]): string {
    const highComplexityFiles = analyses.filter(a => a.complexity > 7).length
    const totalFiles = analyses.length
    
    if (highComplexityFiles / totalFiles > 0.3) {
      return 'Consider optimization for complex files'
    }
    
    return 'Good - Well-structured code with reasonable complexity'
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
    
    try {
      onProgress({ type: 'started', message: 'Starting documentation generation...', progress: 0 })
      
      // Step 1: Categorize and prioritize files (fast)
      onProgress({ type: 'started', message: 'Analyzing project structure...', progress: 5 })
      
      const categorizedFiles = await this.fileCollector.categorizeFiles(files)
      const prioritizedFiles = await this.fileCollector.prioritizeFiles(files)
      
      onProgress({ type: 'categorized', message: `Organized ${files.length} files by importance`, progress: 10 })

      // Step 2: Analyze files in parallel batches (concurrent)
      const analyses: FileAnalysis[] = []
      const batchSize = 3 // Reduced batch size for stability
      const maxFiles = Math.min(prioritizedFiles.length, 30) // Limit total files to analyze
      
      for (let i = 0; i < maxFiles; i += batchSize) {
        const batch = prioritizedFiles.slice(i, i + batchSize)
        
        const context: ProjectContext = {
          name: repositoryInfo.name,
          description: repositoryInfo.description || '',
          framework: this.detectFramework(files),
          language: repositoryInfo.language || 'unknown',
          patterns: []
        }

        const batchPromises = batch.map(file => 
          this.fileAnalyzer.analyzeFile(file, context)
        )

        const batchResults = await Promise.allSettled(batchPromises)
        
        // Only include successful analyses
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            analyses.push(result.value)
          } else {
            console.error(`Failed to analyze ${batch[index].path}:`, result.reason)
          }
        })

        const progress = 10 + ((i + batch.length) / maxFiles) * 60
        onProgress({ 
          type: 'analyzing', 
          message: `Analyzed ${analyses.length}/${maxFiles} files`, 
          progress 
        })
      }

      onProgress({ type: 'compiling', message: 'Generating documentation sections...', progress: 70 })

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
      
    } catch (error) {
      console.error('Error in documentation generation:', error)
      onProgress({ 
        type: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        progress: 0 
      })
      throw error
    }
  }

  private detectFramework(files: GitHubFile[]): string {
    // Detect framework from package.json, file structure, etc.
    const packageJson = files.find(f => f.name === 'package.json')
    if (packageJson) {
      try {
        const content = JSON.parse(packageJson.content)
        if (content.dependencies?.['next']) return 'Next.js'
        if (content.dependencies?.['react']) return 'React'
        if (content.dependencies?.['vue']) return 'Vue.js'
        if (content.dependencies?.['express']) return 'Express.js'
        if (content.dependencies?.['fastify']) return 'Fastify'
        if (content.dependencies?.['@nestjs/core']) return 'NestJS'
      } catch (e) {
        console.error('Error parsing package.json:', e)
      }
    }
    
    // Check for specific file patterns
    if (files.some(f => f.path.includes('next.config'))) return 'Next.js'
    if (files.some(f => f.path.includes('vite.config'))) return 'Vite'
    if (files.some(f => f.path.includes('nuxt.config'))) return 'Nuxt.js'
    
    return 'Unknown'
  }
}
