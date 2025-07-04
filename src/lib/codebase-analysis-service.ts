import OpenAI from 'openai'

// Enhanced type definitions for codebase analysis
export interface PerformanceBottleneck {
  type: 'performance' | 'architecture' | 'security' | 'maintainability' | 'scalability' | 'cost'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  files: string[]
  codeSnippets?: Array<{
    file: string
    lineNumber?: number
    code: string
    issue: string
  }>
  estimatedTimeToFix: string
  priority: number
}

export interface OptimizationRecommendation {
  category: 'performance' | 'architecture' | 'security' | 'maintainability' | 'scalability' | 'cost'
  title: string
  description: string
  benefits: string[]
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard'
    timeEstimate: string
    steps: string[]
    codeExamples?: Array<{
      before: string
      after: string
      explanation: string
    }>
  }
  impact: {
    performance: number // 1-10 scale
    maintainability: number
    scalability: number
    cost: number
  }
  priority: number
}

export interface CodebaseMetrics {
  overall: {
    complexity: number // 1-10
    maintainability: number // 1-10
    performance: number // 1-10
    security: number // 1-10
    scalability: number // 1-10
    testCoverage: number // 0-100%
  }
  technologies: {
    framework: string
    language: string
    dependencies: Array<{
      name: string
      version: string
      category: 'production' | 'development'
      vulnerabilities?: number
      outdated?: boolean
    }>
  }
  fileAnalysis: {
    totalFiles: number
    totalLines: number
    largestFiles: Array<{
      path: string
      lines: number
      complexity: number
    }>
    duplicateCode: number // percentage
    techDebt: number // estimated hours
  }
}

export interface CodebaseAnalysis {
  projectName: string
  analysisDate: string
  summary: {
    overallScore: number // 1-100
    majorIssues: number
    quickWins: number
    estimatedImprovementTime: string
    potentialPerformanceGain: string
    costSavings: string
  }
  metrics: CodebaseMetrics
  bottlenecks: PerformanceBottleneck[]
  recommendations: OptimizationRecommendation[]
  modernizationPlan: {
    phase1: {
      title: string
      duration: string
      tasks: string[]
      expectedImprovement: string
    }
    phase2: {
      title: string
      duration: string
      tasks: string[]
      expectedImprovement: string
    }
    phase3: {
      title: string
      duration: string
      tasks: string[]
      expectedImprovement: string
    }
  }
  competitiveAnalysis: {
    currentApproach: string
    industryBestPractices: string[]
    gapAnalysis: string[]
    recommendations: string[]
  }
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

export interface ProjectContext {
  name: string
  description?: string
  framework: string
  language: string
  type: 'web-app' | 'api' | 'library' | 'cli' | 'mobile' | 'desktop' | 'other'
  size: 'small' | 'medium' | 'large' | 'enterprise'
}

export interface ProgressEvent {
  type: 'started' | 'analyzing' | 'bottlenecks' | 'recommendations' | 'completed' | 'error'
  message: string
  progress: number
  stage?: string
  data?: any
}

// Agent 1: Code Architecture Analyzer
class ArchitectureAnalyzerAgent {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }

  async analyzeArchitecture(files: GitHubFile[], context: ProjectContext): Promise<{
    bottlenecks: PerformanceBottleneck[]
    metrics: Partial<CodebaseMetrics>
  }> {
    const architecturalFiles = files.filter(f => 
      f.path.includes('config') || 
      f.path.includes('package.json') || 
      f.path.includes('dockerfile') ||
      f.path.includes('main.') ||
      f.path.includes('app.') ||
      f.path.includes('index.')
    )

    const prompt = `You are a senior software architect analyzing a ${context.framework} ${context.type} project called "${context.name}".

Analyze these key files for architectural bottlenecks and performance issues:

${architecturalFiles.map(f => `
=== ${f.path} ===
${f.content.slice(0, 3000)}
`).join('\n')}

Project Context:
- Framework: ${context.framework}
- Language: ${context.language}
- Type: ${context.type}
- Size: ${context.size}

Identify architectural bottlenecks and provide a JSON analysis:

{
  "bottlenecks": [
    {
      "type": "performance|architecture|security|maintainability|scalability|cost",
      "severity": "critical|high|medium|low",
      "title": "Specific issue title",
      "description": "Detailed explanation of the problem",
      "impact": "What happens if this isn't fixed",
      "files": ["affected file paths"],
      "codeSnippets": [
        {
          "file": "file path",
          "code": "problematic code snippet",
          "issue": "specific issue with this code"
        }
      ],
      "estimatedTimeToFix": "e.g., 2 hours, 1 day, 1 week",
      "priority": 1-10
    }
  ],
  "metrics": {
    "overall": {
      "complexity": 1-10,
      "maintainability": 1-10,
      "performance": 1-10,
      "security": 1-10,
      "scalability": 1-10
    },
    "technologies": {
      "framework": "${context.framework}",
      "language": "${context.language}",
      "dependencies": [
        {
          "name": "dependency name",
          "version": "version",
          "category": "production|development",
          "vulnerabilities": 0,
          "outdated": false
        }
      ]
    }
  }
}

Focus on real, actionable issues that significantly impact performance, maintainability, or scalability.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}')
      return analysis
    } catch (error) {
      console.error('Architecture analysis error:', error)
      return {
        bottlenecks: [],
        metrics: {        overall: {
          complexity: 5,
          maintainability: 5,
          performance: 5,
          security: 5,
          scalability: 5,
          testCoverage: 0
        }
        }
      }
    }
  }
}

// Agent 2: Performance Bottleneck Detector
class PerformanceAnalyzerAgent {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }

  async analyzePerformance(files: GitHubFile[], context: ProjectContext): Promise<PerformanceBottleneck[]> {
    // Focus on performance-critical files
    const performanceCriticalFiles = files.filter(f => 
      f.path.includes('/api/') || 
      f.path.includes('/lib/') ||
      f.path.includes('/utils/') ||
      f.path.includes('service') ||
      f.path.includes('database') ||
      f.path.includes('query') ||
      f.size > 10000 // Large files often have performance issues
    ).slice(0, 10) // Limit to top 10 files

    const bottlenecks: PerformanceBottleneck[] = []

    // Analyze files in batches
    const batchSize = 3
    for (let i = 0; i < performanceCriticalFiles.length; i += batchSize) {
      const batch = performanceCriticalFiles.slice(i, i + batchSize)
      
      const prompt = `Analyze these ${context.framework} files for performance bottlenecks:

${batch.map(f => `
=== ${f.path} (${f.size} bytes) ===
${f.content.slice(0, 4000)}
`).join('\n')}

Look for:
1. Inefficient database queries
2. Memory leaks
3. Blocking operations
4. Excessive API calls
5. Large data processing
6. Poor caching strategies
7. Heavy computations in main thread
8. Inefficient algorithms
9. Resource-intensive operations
10. Scalability bottlenecks

Return JSON array of bottlenecks:
[
  {
    "type": "performance",
    "severity": "critical|high|medium|low",
    "title": "Specific performance issue",
    "description": "Detailed explanation",
    "impact": "Performance impact (e.g., 5-minute response time)",
    "files": ["affected files"],
    "codeSnippets": [
      {
        "file": "file path",
        "code": "problematic code",
        "issue": "specific performance issue"
      }
    ],
    "estimatedTimeToFix": "time estimate",
    "priority": 1-10
  }
]`

      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 3000,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })

        const result = JSON.parse(response.choices[0]?.message?.content || '{"bottlenecks": []}')
        if (result.bottlenecks) {
          bottlenecks.push(...result.bottlenecks)
        }
      } catch (error) {
        console.error('Performance analysis error for batch:', error)
      }
    }

    return bottlenecks
  }
}

// Agent 3: Optimization Recommendations Generator
class OptimizationRecommendationAgent {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }

  async generateRecommendations(
    bottlenecks: PerformanceBottleneck[],
    context: ProjectContext,
    metrics: CodebaseMetrics
  ): Promise<OptimizationRecommendation[]> {
    const prompt = `You are a senior software architect creating optimization recommendations for a ${context.framework} ${context.type} project.

Project: ${context.name}
Framework: ${context.framework}
Current Issues Found:
${bottlenecks.map(b => `- ${b.severity.toUpperCase()}: ${b.title} (${b.type})`).join('\n')}

Overall Metrics:
- Complexity: ${metrics.overall?.complexity || 5}/10
- Maintainability: ${metrics.overall?.maintainability || 5}/10  
- Performance: ${metrics.overall?.performance || 5}/10
- Scalability: ${metrics.overall?.scalability || 5}/10

Generate comprehensive optimization recommendations as JSON:

{
  "recommendations": [
    {
      "category": "performance|architecture|security|maintainability|scalability|cost",
      "title": "Specific optimization recommendation",
      "description": "Detailed explanation of the recommendation",
      "benefits": [
        "Specific benefit 1",
        "Specific benefit 2"
      ],
      "implementation": {
        "difficulty": "easy|medium|hard",
        "timeEstimate": "specific time estimate",
        "steps": [
          "Step 1: Specific action",
          "Step 2: Specific action"
        ],
        "codeExamples": [
          {
            "before": "current problematic code",
            "after": "optimized code",
            "explanation": "why this is better"
          }
        ]
      },
      "impact": {
        "performance": 1-10,
        "maintainability": 1-10,
        "scalability": 1-10,
        "cost": 1-10
      },
      "priority": 1-10
    }
  ]
}

Focus on:
1. Quick wins (high impact, low effort)
2. Critical performance improvements
3. Modern best practices
4. Scalability enhancements
5. Cost optimizations
6. Security improvements

Provide specific, actionable recommendations with real code examples.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 5000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0]?.message?.content || '{"recommendations": []}')
      return result.recommendations || []
    } catch (error) {
      console.error('Recommendations generation error:', error)
      return []
    }
  }
}

// Agent 4: Modernization Plan Generator
class ModernizationPlanAgent {
  private openai: OpenAI
  
  constructor(openai: OpenAI) {
    this.openai = openai
  }

  async generateModernizationPlan(
    recommendations: OptimizationRecommendation[],
    context: ProjectContext,
    metrics: CodebaseMetrics
  ): Promise<CodebaseAnalysis['modernizationPlan']> {
    const prompt = `Create a phased modernization plan for ${context.name} (${context.framework} ${context.type}).

Current State:
- Complexity: ${metrics.overall?.complexity || 5}/10
- Performance: ${metrics.overall?.performance || 5}/10
- Maintainability: ${metrics.overall?.maintainability || 5}/10

Key Recommendations:
${recommendations.slice(0, 8).map(r => `- ${r.category}: ${r.title} (Priority: ${r.priority})`).join('\n')}

Create a 3-phase modernization plan as JSON:

{
  "phase1": {
    "title": "Quick Wins & Critical Issues",
    "duration": "1-2 weeks",
    "tasks": [
      "Specific task 1",
      "Specific task 2"
    ],
    "expectedImprovement": "Expected improvement description"
  },
  "phase2": {
    "title": "Architecture & Performance",
    "duration": "3-4 weeks", 
    "tasks": [
      "Specific task 1",
      "Specific task 2"
    ],
    "expectedImprovement": "Expected improvement description"
  },
  "phase3": {
    "title": "Advanced Optimizations",
    "duration": "4-6 weeks",
    "tasks": [
      "Specific task 1",
      "Specific task 2"
    ],
    "expectedImprovement": "Expected improvement description"
  }
}

Focus on:
- Phase 1: High-impact, low-effort improvements
- Phase 2: Core architecture and performance fixes
- Phase 3: Advanced optimizations and future-proofing`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0]?.message?.content || '{}')
      return result
    } catch (error) {
      console.error('Modernization plan error:', error)
      return {
        phase1: {
          title: "Quick Wins",
          duration: "1-2 weeks",
          tasks: ["Identify and fix critical issues"],
          expectedImprovement: "Immediate stability improvements"
        },
        phase2: {
          title: "Core Improvements",
          duration: "3-4 weeks",
          tasks: ["Implement main optimizations"],
          expectedImprovement: "Significant performance gains"
        },
        phase3: {
          title: "Advanced Optimizations",
          duration: "4-6 weeks",
          tasks: ["Future-proof the codebase"],
          expectedImprovement: "Long-term scalability"
        }
      }
    }
  }
}

// Main Orchestrator for Codebase Analysis
export class CodebaseAnalysisService {
  private architectureAnalyzer: ArchitectureAnalyzerAgent
  private performanceAnalyzer: PerformanceAnalyzerAgent
  private recommendationGenerator: OptimizationRecommendationAgent
  private modernizationPlanner: ModernizationPlanAgent

  constructor(openai: OpenAI) {
    this.architectureAnalyzer = new ArchitectureAnalyzerAgent(openai)
    this.performanceAnalyzer = new PerformanceAnalyzerAgent(openai)
    this.recommendationGenerator = new OptimizationRecommendationAgent(openai)
    this.modernizationPlanner = new ModernizationPlanAgent(openai)
  }

  async analyzeCodebase(
    files: GitHubFile[],
    repositoryInfo: RepositoryInfo,
    onProgress: (event: ProgressEvent) => void
  ): Promise<CodebaseAnalysis> {
    try {
      onProgress({ type: 'started', message: 'Starting codebase analysis...', progress: 0 })

      const context: ProjectContext = {
        name: repositoryInfo.name,
        description: repositoryInfo.description || '',
        framework: this.detectFramework(files),
        language: repositoryInfo.language || 'unknown',
        type: this.detectProjectType(files),
        size: this.calculateProjectSize(files)
      }

      onProgress({ type: 'analyzing', message: 'Analyzing architecture...', progress: 20 })

      // Step 1: Architecture Analysis
      const architectureAnalysis = await this.architectureAnalyzer.analyzeArchitecture(files, context)
      
      onProgress({ type: 'bottlenecks', message: 'Identifying performance bottlenecks...', progress: 40 })

      // Step 2: Performance Analysis
      const performanceBottlenecks = await this.performanceAnalyzer.analyzePerformance(files, context)
      
      // Combine all bottlenecks
      const allBottlenecks = [...architectureAnalysis.bottlenecks, ...performanceBottlenecks]
        .sort((a, b) => b.priority - a.priority)

      onProgress({ type: 'recommendations', message: 'Generating optimization recommendations...', progress: 60 })

      // Step 3: Generate Recommendations
      const completeMetrics: CodebaseMetrics = {
        ...architectureAnalysis.metrics,
        fileAnalysis: {
          totalFiles: files.length,
          totalLines: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
          largestFiles: files
            .sort((a, b) => b.size - a.size)
            .slice(0, 10)
            .map(f => ({
              path: f.path,
              lines: f.content.split('\n').length,
              complexity: this.calculateComplexity(f.content)
            })),
          duplicateCode: this.estimateDuplicateCode(files),
          techDebt: this.estimateTechDebt(allBottlenecks)
        }
      } as CodebaseMetrics

      const recommendations = await this.recommendationGenerator.generateRecommendations(
        allBottlenecks,
        context,
        completeMetrics
      )

      onProgress({ type: 'recommendations', message: 'Creating modernization plan...', progress: 80 })

      // Step 4: Generate Modernization Plan
      const modernizationPlan = await this.modernizationPlanner.generateModernizationPlan(
        recommendations,
        context,
        completeMetrics
      )

      onProgress({ type: 'completed', message: 'Analysis complete!', progress: 100 })

      // Calculate overall score
      const overallScore = this.calculateOverallScore(completeMetrics, allBottlenecks)

      const analysis: CodebaseAnalysis = {
        projectName: repositoryInfo.name,
        analysisDate: new Date().toISOString(),
        summary: {
          overallScore,
          majorIssues: allBottlenecks.filter(b => b.severity === 'critical' || b.severity === 'high').length,
          quickWins: recommendations.filter(r => r.implementation.difficulty === 'easy' && r.priority >= 7).length,
          estimatedImprovementTime: this.estimateImprovementTime(recommendations),
          potentialPerformanceGain: this.estimatePerformanceGain(allBottlenecks, recommendations),
          costSavings: this.estimateCostSavings(recommendations)
        },
        metrics: completeMetrics,
        bottlenecks: allBottlenecks,
        recommendations: recommendations.sort((a, b) => b.priority - a.priority),
        modernizationPlan,
        competitiveAnalysis: {
          currentApproach: `${context.framework} ${context.type} with ${context.language}`,
          industryBestPractices: this.getIndustryBestPractices(context),
          gapAnalysis: this.generateGapAnalysis(allBottlenecks, context),
          recommendations: this.generateCompetitiveRecommendations(context, recommendations)
        }
      }

      return analysis

    } catch (error) {
      console.error('Codebase analysis error:', error)
      onProgress({ 
        type: 'error', 
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        progress: 0 
      })
      throw error
    }
  }

  private detectFramework(files: GitHubFile[]): string {
    const packageJson = files.find(f => f.name === 'package.json')
    if (packageJson) {
      try {
        const content = JSON.parse(packageJson.content)
        if (content.dependencies?.['next']) return 'Next.js'
        if (content.dependencies?.['react']) return 'React'
        if (content.dependencies?.['vue']) return 'Vue.js'
        if (content.dependencies?.['express']) return 'Express.js'
        if (content.dependencies?.['@nestjs/core']) return 'NestJS'
      } catch (e) {
        console.error('Error parsing package.json:', e)
      }
    }
    
    if (files.some(f => f.path.includes('next.config'))) return 'Next.js'
    if (files.some(f => f.path.includes('vite.config'))) return 'Vite'
    if (files.some(f => f.path.includes('angular.json'))) return 'Angular'
    
    return 'Unknown'
  }

  private detectProjectType(files: GitHubFile[]): ProjectContext['type'] {
    if (files.some(f => f.path.includes('/api/') || f.path.includes('/routes/'))) return 'web-app'
    if (files.some(f => f.path.includes('/components/') || f.path.includes('/pages/'))) return 'web-app'
    if (files.some(f => f.path.includes('server.') || f.path.includes('app.js'))) return 'api'
    if (files.some(f => f.path.includes('cli.') || f.path.includes('bin/'))) return 'cli'
    return 'other'
  }

  private calculateProjectSize(files: GitHubFile[]): ProjectContext['size'] {
    const totalLines = files.reduce((sum, f) => sum + f.content.split('\n').length, 0)
    if (totalLines < 1000) return 'small'
    if (totalLines < 10000) return 'medium'
    if (totalLines < 50000) return 'large'
    return 'enterprise'
  }

  private calculateComplexity(content: string): number {
    const lines = content.split('\n').length
    const conditions = (content.match(/if\s*\(|else|switch|case|try|catch|for\s*\(|while\s*\(/g) || []).length
    const functions = (content.match(/function|=>|def\s+|class\s+/g) || []).length
    
    return Math.min(10, Math.floor((conditions + functions) / Math.max(1, lines / 50)))
  }

  private estimateDuplicateCode(files: GitHubFile[]): number {
    // Simple heuristic - count similar patterns
    const codeBlocks = files.flatMap(f => f.content.split('\n').filter(line => line.trim().length > 10))
    const uniqueBlocks = new Set(codeBlocks)
    return Math.floor(((codeBlocks.length - uniqueBlocks.size) / codeBlocks.length) * 100)
  }

  private estimateTechDebt(bottlenecks: PerformanceBottleneck[]): number {
    return bottlenecks.reduce((sum, b) => {
      const timeMap = { '1 hour': 1, '2 hours': 2, '1 day': 8, '2 days': 16, '1 week': 40, '2 weeks': 80 }
      return sum + (timeMap[b.estimatedTimeToFix as keyof typeof timeMap] || 4)
    }, 0)
  }

  private calculateOverallScore(metrics: CodebaseMetrics, bottlenecks: PerformanceBottleneck[]): number {
    const criticalIssues = bottlenecks.filter(b => b.severity === 'critical').length
    const highIssues = bottlenecks.filter(b => b.severity === 'high').length
    
    const baseScore = (
      (metrics.overall?.complexity || 5) * 0.2 +
      (metrics.overall?.maintainability || 5) * 0.3 +
      (metrics.overall?.performance || 5) * 0.3 +
      (metrics.overall?.security || 5) * 0.2
    ) * 10

    // Deduct points for issues
    const deductions = criticalIssues * 15 + highIssues * 8
    
    return Math.max(0, Math.min(100, Math.floor(baseScore - deductions)))
  }

  private estimateImprovementTime(recommendations: OptimizationRecommendation[]): string {
    const totalHours = recommendations.reduce((sum, r) => {
      const timeMap = { 'easy': 4, 'medium': 16, 'hard': 40 }
      return sum + timeMap[r.implementation.difficulty]
    }, 0)
    
    if (totalHours <= 40) return `${Math.ceil(totalHours/8)} weeks`
    if (totalHours <= 160) return `${Math.ceil(totalHours/40)} months`
    return `${Math.ceil(totalHours/160)} quarters`
  }

  private estimatePerformanceGain(bottlenecks: PerformanceBottleneck[], recommendations: OptimizationRecommendation[]): string {
    const performanceImpact = recommendations
      .filter(r => r.category === 'performance')
      .reduce((sum, r) => sum + r.impact.performance, 0)
    
    if (performanceImpact >= 40) return '5-10x faster'
    if (performanceImpact >= 20) return '2-5x faster'
    if (performanceImpact >= 10) return '50-100% faster'
    return '20-50% faster'
  }

  private estimateCostSavings(recommendations: OptimizationRecommendation[]): string {
    const costImpact = recommendations
      .filter(r => r.category === 'cost')
      .reduce((sum, r) => sum + r.impact.cost, 0)
    
    if (costImpact >= 30) return '60-80% cost reduction'
    if (costImpact >= 15) return '30-60% cost reduction'
    if (costImpact >= 5) return '10-30% cost reduction'
    return '5-15% cost reduction'
  }

  private getIndustryBestPractices(context: ProjectContext): string[] {
    const practices = [
      'Microservices architecture',
      'Containerization with Docker',
      'CI/CD pipelines',
      'Infrastructure as Code',
      'Monitoring and observability',
      'Security-first development',
      'Performance optimization',
      'Code quality automation'
    ]
    
    if (context.framework === 'Next.js') {
      practices.push('Server-side rendering', 'Edge computing', 'Image optimization')
    }
    
    return practices
  }

  private generateGapAnalysis(bottlenecks: PerformanceBottleneck[], context: ProjectContext): string[] {
    const gaps = bottlenecks.map(b => `Missing: ${b.title}`)
    
    if (context.framework === 'Next.js' && !bottlenecks.some(b => b.title.includes('caching'))) {
      gaps.push('Insufficient caching strategy')
    }
    
    return gaps.slice(0, 8)
  }

  private generateCompetitiveRecommendations(context: ProjectContext, recommendations: OptimizationRecommendation[]): string[] {
    return recommendations
      .filter(r => r.priority >= 7)
      .map(r => r.title)
      .slice(0, 6)
  }
}
