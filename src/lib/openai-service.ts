import OpenAI from 'openai'

export interface CodeFile {
  name: string
  content: string
  path: string
  language: string
  size: number
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
  fileDocumentations: Record<string, {
    summary: string
    purpose: string
    importance: 'Critical' | 'High' | 'Medium' | 'Low'
    keyFunctions: Array<{
      name: string
      description: string
      parameters: Array<{ name: string; type: string; description: string }>
      returns: { type: string; description: string }
      examples?: string[]
      complexity?: 'Simple' | 'Moderate' | 'Complex'
      bestPractices?: string[]
    }>
    classes: Array<{
      name: string
      description: string
      properties: Array<{ name: string; type: string; description: string }>
      methods: Array<{
        name: string
        description: string
        parameters: Array<{ name: string; type: string; description: string }>
        returns: { type: string; description: string }
        visibility?: 'public' | 'private' | 'protected'
      }>
      usagePatterns?: string[]
    }>
    constants: Array<{
      name: string
      type: string
      value?: string
      description: string
      category?: string
    }>
    dependencies: string[]
    codeQuality?: {
      readability: number // 1-10
      complexity: number // 1-10
      maintainability: number // 1-10
    }
  }>
}

class OpenAIService {
  private client: OpenAI
  private static instance: OpenAIService

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService()
    }
    return OpenAIService.instance
  }

  async analyzeCodebase(files: CodeFile[], repositoryName: string, repositoryDescription?: string): Promise<ProjectAnalysis> {
    try {
      const fileContents = files.map(file => `=== ${file.path} (${file.language}) ===\n${file.content}`).join('\n\n')
      
      const userPrompt = `You are a world-class software engineer, technical writer, and UX expert. Your mission is to create EXCEPTIONAL, user-focused documentation that delights developers and showcases the true value of "${repositoryName}". This documentation should be so good that users feel excited about their investment and proud to share it.

${repositoryDescription ? `Project Description: ${repositoryDescription}` : ''}

CODEBASE FILES:
${fileContents}

Create a comprehensive analysis in JSON format that follows industry best practices and makes developers genuinely excited to use this project:

{
  "overview": "Write a compelling project overview that captures attention immediately. Include: What problem this solves, who benefits from it, key differentiators, impressive features, and clear value proposition. Make it sound professional yet approachable - like documentation from top tech companies.",
  "architecture": "Provide an executive-level architectural overview that demonstrates thoughtful design. Explain design patterns, scalability considerations, security aspects, performance optimizations, and why specific technologies were chosen. Include diagrams in markdown format where helpful.",
  "gettingStarted": "Create a frictionless onboarding experience with multiple paths: Quick Start (5 minutes), Standard Setup (15 minutes), Advanced Configuration. Include prerequisites with version requirements, installation steps with copy-paste commands, environment setup, verification steps, and troubleshooting for common issues.",
  "apiReference": "Document every API endpoint, function, and interface with professional-grade detail. Include: HTTP methods, request/response examples, error codes, rate limiting, authentication, SDKs, and interactive examples. Make it as good as Stripe or GitHub's API docs.",
  "projectStructure": "Provide an intuitive explanation of the codebase organization. Use tree diagrams, explain the purpose of each major directory, highlight key files, and show how components interact. Make navigation effortless.",
  "keyComponents": "Identify and thoroughly explain the core components that make this project special. For each component: purpose, key features, usage patterns, customization options, and integration points. Focus on value delivery.",
  "usageExamples": "Create extensive, real-world examples that demonstrate practical value. Include: common use cases, advanced scenarios, best practices, performance tips, integration examples, and complete working code samples. Show don't just tell.",
  "highlights": {
    "keyFeatures": ["List 5-8 standout features that make this project valuable"],
    "technologies": ["Key technologies and why they were chosen"],
    "useCases": ["Real-world scenarios where this project excels"],
    "benefits": ["Clear benefits users get from using this project"]
  },
  "metrics": {
    "complexity": "Low/Medium/High - Overall project complexity",
    "maintainability": "Rate the code maintainability",
    "testCoverage": "Assessment of testing approach",
    "performance": "Performance characteristics and optimizations"
  },
  "fileDocumentations": {
    "filename.ext": {
      "summary": "Concise, value-focused summary of what this file accomplishes",
      "purpose": "Clear explanation of why this file exists and its role in the bigger picture",
      "importance": "Critical/High/Medium/Low - How important this file is to the project",
      "keyFunctions": [
        {
          "name": "functionName",
          "description": "Detailed explanation with practical context",
          "parameters": [...],
          "returns": {...},
          "examples": ["Working code examples"],
          "complexity": "Simple/Moderate/Complex",
          "bestPractices": ["Tips for using this function effectively"]
        }
      ],
      "classes": [
        {
          "name": "ClassName",
          "description": "Comprehensive class explanation",
          "properties": [...],
          "methods": [...],
          "usagePatterns": ["Common ways to use this class"]
        }
      ],
      "constants": [
        {
          "name": "CONSTANT_NAME",
          "type": "type",
          "value": "value",
          "description": "What this constant is for",
          "category": "configuration/validation/etc"
        }
      ],
      "dependencies": ["clear list of dependencies with brief explanations"],
      "codeQuality": {
        "readability": 9,
        "complexity": 7,
        "maintainability": 8
      }
    }
  }
}

PROFESSIONAL DOCUMENTATION STANDARDS:
✨ ENGAGEMENT: Write like you're explaining to a colleague you respect - professional but friendly
🎯 VALUE-FOCUSED: Always explain the "why" and "what value does this provide"
📚 COMPREHENSIVE: Cover everything but organize it logically with clear navigation
🔧 PRACTICAL: Every code example should be copy-pastable and work out of the box
🏆 PROFESSIONAL: Match the quality of documentation from companies like Vercel, Stripe, or GitHub
🚀 INSPIRING: Make developers excited to use and contribute to this project
💡 CLEAR: Complex concepts explained in simple terms with progressive complexity
🔍 DISCOVERABLE: Easy to scan, search, and navigate with clear headings and structure
⚡ ACTIONABLE: Every section should help users accomplish something concrete
🛡️ RELIABLE: Include error handling, edge cases, and troubleshooting guidance

Make this documentation so exceptional that users immediately understand they got incredible value for their money.`

      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 32000,
        temperature: 0.1
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      // Extract JSON from markdown code blocks if present
      let jsonContent = content.trim()
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const analysis = JSON.parse(jsonContent) as ProjectAnalysis
      return analysis

    } catch (error) {
      console.error('Error analyzing codebase with OpenAI:', error)
      throw new Error(`Failed to analyze codebase: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateMarkdownDocumentation(
    analysis: ProjectAnalysis,
    repositoryName: string,
    repositoryFullName: string,
    filesAnalyzed: number
  ): Promise<string> {
    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    let markdown = `<div align="center">\n\n`
    markdown += `# 📚 ${repositoryName}\n`
    markdown += `### Professional Documentation\n\n`
    markdown += `[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/${repositoryFullName})\n`
    markdown += `[![Documentation](https://img.shields.io/badge/Docs-AI%20Generated-green?style=for-the-badge&logo=book)]()\n`
    markdown += `[![Analysis](https://img.shields.io/badge/Files%20Analyzed-${filesAnalyzed}-orange?style=for-the-badge&logo=code)](#file-documentation)\n\n`
    markdown += `*Generated with ❤️ by [DocuGenius AI](https://docugenius.dev) • ${formattedDate}*\n\n`
    markdown += `</div>\n\n`
    markdown += `---\n\n`

    // Quick Navigation Bar
    markdown += `<div align="center">\n\n`
    markdown += `**📋 Quick Navigation**\n\n`
    markdown += `[🚀 Overview](#-overview) • `
    markdown += `[⚡ Quick Start](#-quick-start) • `
    markdown += `[🏗️ Architecture](#-architecture) • `
    markdown += `[📖 API Reference](#-api-reference) • `
    markdown += `[💡 Examples](#-usage-examples) • `
    markdown += `[📁 Project Structure](#-project-structure)\n\n`
    markdown += `</div>\n\n`
    markdown += `---\n\n`

    // Hero Section with Overview
    markdown += `## 🚀 Overview\n\n`
    markdown += `<div align="center">\n\n`
    markdown += `### 🎯 What This Project Does\n\n`
    markdown += `</div>\n\n`
    markdown += `${analysis.overview}\n\n`

    // Add highlights section if available
    if (analysis.highlights) {
      markdown += `<div align="center">\n\n`
      markdown += `### ✨ Project Highlights\n\n`
      markdown += `</div>\n\n`
      
      if (analysis.highlights.keyFeatures?.length > 0) {
        markdown += `#### 🌟 Key Features\n\n`
        analysis.highlights.keyFeatures.forEach(feature => {
          markdown += `- ✅ ${feature}\n`
        })
        markdown += `\n`
      }

      if (analysis.highlights.technologies?.length > 0) {
        markdown += `#### 🛠️ Technologies\n\n`
        analysis.highlights.technologies.forEach(tech => {
          markdown += `- 🔧 ${tech}\n`
        })
        markdown += `\n`
      }

      if (analysis.highlights.useCases?.length > 0) {
        markdown += `#### 🎯 Perfect For\n\n`
        analysis.highlights.useCases.forEach(useCase => {
          markdown += `- 📈 ${useCase}\n`
        })
        markdown += `\n`
      }

      if (analysis.highlights.benefits?.length > 0) {
        markdown += `#### 💎 Why Choose This Project\n\n`
        analysis.highlights.benefits.forEach(benefit => {
          markdown += `- 🚀 ${benefit}\n`
        })
        markdown += `\n`
      }
    }

    // Project metrics if available
    if (analysis.metrics) {
      markdown += `<details>\n`
      markdown += `<summary>📊 <strong>Project Metrics & Assessment</strong></summary>\n\n`
      markdown += `| Metric | Assessment | Details |\n`
      markdown += `|--------|------------|----------|\n`
      markdown += `| 📁 Files Analyzed | ${filesAnalyzed} | Complete codebase coverage |\n`
      markdown += `| 🧠 Complexity | ${analysis.metrics.complexity || 'N/A'} | Overall project complexity |\n`
      markdown += `| 🔧 Maintainability | ${analysis.metrics.maintainability || 'N/A'} | Code quality and structure |\n`
      markdown += `| 🧪 Testing | ${analysis.metrics.testCoverage || 'N/A'} | Test coverage and quality |\n`
      markdown += `| ⚡ Performance | ${analysis.metrics.performance || 'N/A'} | Speed and optimization |\n`
      markdown += `| 📅 Generated | ${formattedDate} | Documentation freshness |\n`
      markdown += `| 🤖 AI Engine | OpenAI GPT-4 | Advanced code analysis |\n\n`
      markdown += `</details>\n\n`
    } else {
      markdown += `<details>\n`
      markdown += `<summary>📊 <strong>Project Statistics</strong></summary>\n\n`
      markdown += `| Metric | Value |\n`
      markdown += `|--------|-------|\n`
      markdown += `| 📁 Files Analyzed | ${filesAnalyzed} |\n`
      markdown += `| 📅 Documentation Generated | ${formattedDate} |\n`
      markdown += `| 🤖 AI Engine | OpenAI GPT-4 |\n`
      markdown += `| 📖 Documentation Type | Comprehensive |\n\n`
      markdown += `</details>\n\n`
    }

    // Quick Start Section
    markdown += `## ⚡ Quick Start\n\n`
    markdown += `<div align="left">\n\n`
    markdown += `### 🏃‍♂️ Get Running in 5 Minutes\n\n`
    markdown += `</div>\n\n`
    markdown += `${analysis.gettingStarted}\n\n`
    markdown += `> 💡 **Pro Tip**: Bookmark this documentation and share it with your team for easy reference!\n\n`

    // Architecture Section with Visual Appeal
    markdown += `## 🏗️ Architecture\n\n`
    markdown += `<div align="center">\n\n`
    markdown += `### 🧠 System Design & Architecture\n\n`
    markdown += `</div>\n\n`
    markdown += `${analysis.architecture}\n\n`
    markdown += `<details>\n`
    markdown += `<summary>🔍 <strong>Architecture Deep Dive</strong></summary>\n\n`
    markdown += `This section provides detailed insights into the architectural decisions and design patterns used in this project. The architecture has been carefully analyzed to ensure scalability, maintainability, and performance.\n\n`
    markdown += `</details>\n\n`

    // Project Structure with Tree View
    markdown += `## 📁 Project Structure\n\n`
    markdown += `### 🌳 Codebase Organization\n\n`
    markdown += `${analysis.projectStructure}\n\n`
    markdown += `<details>\n`
    markdown += `<summary>📋 <strong>File Structure Guide</strong></summary>\n\n`
    markdown += `Understanding the project structure is crucial for contributing and maintaining the codebase. Each directory has been organized with specific purposes and follows industry best practices.\n\n`
    markdown += `</details>\n\n`

    // Key Components with Enhanced Formatting
    markdown += `## 🔑 Key Components\n\n`
    markdown += `### ⚙️ Core System Components\n\n`
    markdown += `${analysis.keyComponents}\n\n`
    markdown += `> 🔥 **Developer Experience**: These components have been designed with developer productivity and code maintainability in mind.\n\n`

    // Professional API Reference
    markdown += `## 📖 API Reference\n\n`
    markdown += `<div align="center">\n\n`
    markdown += `### 🛠️ Complete API Documentation\n\n`
    markdown += `</div>\n\n`
    markdown += `${analysis.apiReference}\n\n`
    markdown += `<details>\n`
    markdown += `<summary>📚 <strong>API Usage Guidelines</strong></summary>\n\n`
    markdown += `- All APIs follow RESTful conventions where applicable\n`
    markdown += `- Comprehensive error handling with meaningful messages\n`
    markdown += `- Full TypeScript support for enhanced developer experience\n`
    markdown += `- Extensive testing coverage for reliability\n\n`
    markdown += `</details>\n\n`

    // Enhanced Usage Examples
    markdown += `## 💡 Usage Examples\n\n`
    markdown += `### 🎨 Real-World Implementation Examples\n\n`
    markdown += `${analysis.usageExamples}\n\n`
    markdown += `<div align="center">\n\n`
    markdown += `**🌟 Want to see more examples?** Check out our [example repository](https://github.com/${repositoryFullName}/tree/examples) for additional use cases!\n\n`
    markdown += `</div>\n\n`

    // Enhanced File Documentation
    markdown += `## 📄 File Documentation\n\n`
    markdown += `### 📋 Detailed File Analysis\n\n`
    markdown += `<div align="center">\n\n`
    markdown += `*Comprehensive documentation for every file in the codebase*\n\n`
    markdown += `</div>\n\n`

    Object.entries(analysis.fileDocumentations).forEach(([fileName, doc]) => {
      markdown += `<details>\n`
      markdown += `<summary>📄 <strong><code>${fileName}</code></strong> ${doc.importance ? `<span style="color: ${doc.importance === 'Critical' ? 'red' : doc.importance === 'High' ? 'orange' : doc.importance === 'Medium' ? 'blue' : 'gray'};">• ${doc.importance} Importance</span>` : ''}</summary>\n\n`
      markdown += `### 🎯 Purpose\n${doc.purpose}\n\n`
      markdown += `### 📝 Summary\n${doc.summary}\n\n`

      if (doc.codeQuality) {
        markdown += `### 📊 Code Quality Metrics\n\n`
        markdown += `| Metric | Score | Assessment |\n|--------|-------|------------|\n`
        markdown += `| 📖 Readability | ${doc.codeQuality.readability}/10 | ${doc.codeQuality.readability >= 8 ? 'Excellent' : doc.codeQuality.readability >= 6 ? 'Good' : 'Needs Improvement'} |\n`
        markdown += `| 🧠 Complexity | ${doc.codeQuality.complexity}/10 | ${doc.codeQuality.complexity <= 5 ? 'Simple' : doc.codeQuality.complexity <= 7 ? 'Moderate' : 'Complex'} |\n`
        markdown += `| 🔧 Maintainability | ${doc.codeQuality.maintainability}/10 | ${doc.codeQuality.maintainability >= 8 ? 'Excellent' : doc.codeQuality.maintainability >= 6 ? 'Good' : 'Needs Improvement'} |\n\n`
      }

      if (doc.dependencies && doc.dependencies.length > 0) {
        markdown += `### 🔗 Dependencies\n`
        markdown += `| Dependency | Type |\n|------------|------|\n`
        doc.dependencies.forEach(dep => {
          markdown += `| \`${dep}\` | Module |\n`
        })
        markdown += `\n`
      }

      if (doc.keyFunctions && doc.keyFunctions.length > 0) {
        markdown += `### ⚡ Key Functions\n\n`
        doc.keyFunctions.forEach((func) => {
          markdown += `#### \`${func.name || 'Unknown Function'}\`\n\n`
          
          if (func.complexity) {
            markdown += `**Complexity**: ${func.complexity} | `
          }
          markdown += `**Description**: ${func.description || 'No description available'}\n\n`

          if (func.parameters && func.parameters.length > 0) {
            markdown += `**Parameters**:\n\n`
            markdown += `| Parameter | Type | Description |\n|-----------|------|-------------|\n`
            func.parameters.forEach((param) => {
              markdown += `| \`${param.name || 'param'}\` | \`${param.type || 'any'}\` | ${param.description || 'No description'} |\n`
            })
            markdown += `\n`
          }

          if (func.returns) {
            markdown += `**Returns**: \`${func.returns.type || 'void'}\` - ${func.returns.description || 'No description'}\n\n`
          }

          if (func.bestPractices && func.bestPractices.length > 0) {
            markdown += `**💡 Best Practices**:\n\n`
            func.bestPractices.forEach(practice => {
              markdown += `- ${practice}\n`
            })
            markdown += `\n`
          }

          if (func.examples && func.examples.length > 0) {
            markdown += `**Example Usage**:\n\n`
            func.examples.forEach((example) => {
              markdown += `\`\`\`javascript\n${example}\n\`\`\`\n\n`
            })
          }
        })
      }

      if (doc.classes && doc.classes.length > 0) {
        markdown += `### 🏗️ Classes\n\n`
        doc.classes.forEach((cls) => {
          markdown += `#### \`${cls.name || 'Unknown Class'}\`\n\n`
          markdown += `${cls.description || 'No description available'}\n\n`

          if (cls.properties && cls.properties.length > 0) {
            markdown += `**Properties**:\n\n`
            markdown += `| Property | Type | Description |\n|----------|------|-------------|\n`
            cls.properties.forEach((prop) => {
              markdown += `| \`${prop.name || 'property'}\` | \`${prop.type || 'any'}\` | ${prop.description || 'No description'} |\n`
            })
            markdown += `\n`
          }

          if (cls.methods && cls.methods.length > 0) {
            markdown += `**Methods**:\n\n`
            cls.methods.forEach((method) => {
              markdown += `##### \`${method.name || 'method'}\`\n\n`
              if (method.visibility) {
                markdown += `**Visibility**: ${method.visibility} | `
              }
              markdown += `${method.description || 'No description'}\n\n`

              if (method.parameters && method.parameters.length > 0) {
                markdown += `| Parameter | Type | Description |\n|-----------|------|-------------|\n`
                method.parameters.forEach((param) => {
                  markdown += `| \`${param.name || 'param'}\` | \`${param.type || 'any'}\` | ${param.description || 'No description'} |\n`
                })
                markdown += `\n`
              }

              if (method.returns) {
                markdown += `**Returns**: \`${method.returns.type || 'void'}\` - ${method.returns.description || 'No description'}\n\n`
              }
            })
          }

          if (cls.usagePatterns && cls.usagePatterns.length > 0) {
            markdown += `**💡 Common Usage Patterns**:\n\n`
            cls.usagePatterns.forEach(pattern => {
              markdown += `- ${pattern}\n`
            })
            markdown += `\n`
          }
        })
      }

      if (doc.constants && doc.constants.length > 0) {
        markdown += `### 📊 Constants\n\n`
        markdown += `| Constant | Type | Value | Category | Description |\n|----------|------|-------|----------|-------------|\n`
        doc.constants.forEach((constant) => {
          markdown += `| \`${constant.name || 'Unknown Constant'}\` | \`${constant.type || 'unknown'}\` | \`${constant.value || 'N/A'}\` | ${constant.category || 'General'} | ${constant.description || 'No description'} |\n`
        })
        markdown += `\n`
      }

      markdown += `</details>\n\n`
    })

    // Professional Footer
    markdown += `---\n\n`
    markdown += `<div align="center">\n\n`
    markdown += `## 🤝 Contributing & Support\n\n`
    markdown += `### 🌟 Help Make This Project Even Better\n\n`
    markdown += `[![GitHub Issues](https://img.shields.io/badge/Issues-Report%20Bug-red?style=flat-square&logo=github)](https://github.com/${repositoryFullName}/issues)\n`
    markdown += `[![GitHub PRs](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square&logo=github)](https://github.com/${repositoryFullName}/pulls)\n`
    markdown += `[![GitHub Discussions](https://img.shields.io/badge/Discussions-Join%20Community-blue?style=flat-square&logo=github)](https://github.com/${repositoryFullName}/discussions)\n\n`
    markdown += `### 📞 Need Help?\n\n`
    markdown += `- 📖 **Documentation**: You're looking at it! This comprehensive guide covers everything.\n`
    markdown += `- 🐛 **Found a Bug?**: [Open an issue](https://github.com/${repositoryFullName}/issues) with detailed reproduction steps.\n`
    markdown += `- 💡 **Feature Request?**: [Start a discussion](https://github.com/${repositoryFullName}/discussions) to share your ideas.\n`
    markdown += `- 💬 **Questions?**: Check existing [discussions](https://github.com/${repositoryFullName}/discussions) or create a new one.\n\n`
    markdown += `### 🎯 What Makes This Documentation Special\n\n`
    markdown += `✨ **AI-Powered Analysis**: Generated using advanced AI to ensure comprehensive coverage\n\n`
    markdown += `🔍 **Deep Code Understanding**: Every file, function, and component analyzed in detail\n\n`
    markdown += `📚 **Professional Quality**: Documentation that matches industry standards\n\n`
    markdown += `⚡ **Instantly Useful**: Copy-paste examples and clear explanations\n\n`
    markdown += `🚀 **Always Up-to-Date**: Regenerate anytime as your code evolves\n\n`
    markdown += `---\n\n`
    markdown += `### 🏆 Powered By DocuGenius\n\n`
    markdown += `This professional documentation was generated by **[DocuGenius AI](https://docugenius.dev)** - the intelligent documentation platform that transforms your code into beautiful, comprehensive docs.\n\n`
    markdown += `**Why developers love DocuGenius:**\n`
    markdown += `- 🎯 **Saves Hours**: No more manual documentation writing\n`
    markdown += `- 🧠 **AI-Powered**: Advanced code understanding and analysis\n`
    markdown += `- 📈 **Professional Results**: Documentation that impresses users and contributors\n`
    markdown += `- ⚡ **Lightning Fast**: Generate comprehensive docs in minutes\n\n`
    markdown += `[![Try DocuGenius](https://img.shields.io/badge/Try%20DocuGenius-Generate%20Your%20Docs-brightgreen?style=for-the-badge&logo=robot)](https://docugenius.dev)\n\n`
    markdown += `---\n\n`
    markdown += `<sub>📅 Last Updated: ${formattedDate} | 🤖 Generated by DocuGenius AI | ⭐ [Star this repository](https://github.com/${repositoryFullName}) if this documentation helped you!</sub>\n\n`
    markdown += `</div>`

    return markdown
  }
}

export default OpenAIService
