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
  fileDocumentations: Record<string, {
    summary: string
    purpose: string
    keyFunctions: Array<{
      name: string
      description: string
      parameters: Array<{ name: string; type: string; description: string }>
      returns: { type: string; description: string }
      examples?: string[]
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
      }>
    }>
    constants: Array<{
      name: string
      type: string
      value?: string
      description: string
    }>
    dependencies: string[]
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
      const systemPrompt = "You are an expert software engineer and technical writer. Your task is to analyze a complete codebase and generate comprehensive, user-friendly documentation that helps developers understand and use the project effectively. Focus on: 1. Project overview and purpose 2. Architecture and design patterns 3. How to get started (installation, setup, first steps) 4. Key components and their relationships 5. API reference and usage examples 6. File-by-file analysis with practical insights. Make the documentation practical and actionable for developers who want to understand and contribute to the project."

      const fileContents = files.map(file => `=== ${file.path} (${file.language}) ===\n${file.content}`).join('\n\n')
      
      const userPrompt = `Analyze this complete codebase for "${repositoryName}" and generate comprehensive documentation.

${repositoryDescription ? `Project Description: ${repositoryDescription}` : ''}

CODEBASE FILES:
${fileContents}

Please provide a detailed analysis in JSON format with the following structure:
{
  "overview": "Comprehensive project overview, what it does, main purpose, target audience",
  "architecture": "Detailed explanation of the project architecture, design patterns, folder structure, and how components interact",
  "gettingStarted": "Step-by-step guide for developers to set up and start using the project (installation, configuration, first run)",
  "apiReference": "Complete API documentation with endpoints, functions, and usage patterns",
  "projectStructure": "Explanation of the folder/file organization and what each part does",
  "keyComponents": "Analysis of the most important files/modules and their roles in the system",
  "usageExamples": "Practical examples showing how to use the main features of the project",
  "fileDocumentations": {
    "filename.ext": {
      "summary": "What this file does and its role in the project",
      "purpose": "Why this file exists and how it fits into the bigger picture",
      "keyFunctions": [...],
      "classes": [...],
      "constants": [...],
      "dependencies": ["list of files/modules this depends on"]
    }
  }
}

Make sure to:
- Explain complex concepts in simple terms
- Provide practical examples
- Focus on how developers can actually use and extend the code
- Identify the main entry points and key workflows
- Explain any configuration or environment setup needed
- Document any APIs, interfaces, or important functions thoroughly`

      const response = await this.client.chat.completions.create({
        model: 'o1-mini',
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 16000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      const analysis = JSON.parse(content) as ProjectAnalysis
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
    let markdown = `# ${repositoryName} - Complete Documentation\n\n`
    markdown += `> 🤖 **AI-Generated Documentation** for [\`${repositoryFullName}\`](https://github.com/${repositoryFullName})\n`
    markdown += `> \n> 📊 **Analysis**: ${filesAnalyzed} files analyzed\n`
    markdown += `> 📅 **Generated**: ${new Date().toLocaleDateString()}\n\n`
    markdown += `---\n\n`

    // Table of Contents
    markdown += `## 📚 Table of Contents\n\n`
    markdown += `1. [Project Overview](#-project-overview)\n`
    markdown += `2. [Architecture](#-architecture)\n`
    markdown += `3. [Getting Started](#-getting-started)\n`
    markdown += `4. [Project Structure](#-project-structure)\n`
    markdown += `5. [Key Components](#-key-components)\n`
    markdown += `6. [API Reference](#-api-reference)\n`
    markdown += `7. [Usage Examples](#-usage-examples)\n`
    markdown += `8. [File Documentation](#-file-documentation)\n\n`
    markdown += `---\n\n`

    // Project Overview
    markdown += `## 🚀 Project Overview\n\n`
    markdown += `${analysis.overview}\n\n`

    // Architecture
    markdown += `## 🏗️ Architecture\n\n`
    markdown += `${analysis.architecture}\n\n`

    // Getting Started
    markdown += `## 🚀 Getting Started\n\n`
    markdown += `${analysis.gettingStarted}\n\n`

    // Project Structure
    markdown += `## 📁 Project Structure\n\n`
    markdown += `${analysis.projectStructure}\n\n`

    // Key Components
    markdown += `## 🔑 Key Components\n\n`
    markdown += `${analysis.keyComponents}\n\n`

    // API Reference
    markdown += `## 📖 API Reference\n\n`
    markdown += `${analysis.apiReference}\n\n`

    // Usage Examples
    markdown += `## 💡 Usage Examples\n\n`
    markdown += `${analysis.usageExamples}\n\n`

    // File Documentation
    markdown += `## 📄 File Documentation\n\n`
    Object.entries(analysis.fileDocumentations).forEach(([fileName, doc]) => {
      markdown += `### \`${fileName}\`\n\n`
      markdown += `**Purpose**: ${doc.purpose}\n\n`
      markdown += `**Summary**: ${doc.summary}\n\n`

      if (doc.dependencies.length > 0) {
        markdown += `**Dependencies**: ${doc.dependencies.map(dep => `\`${dep}\``).join(', ')}\n\n`
      }

      if (doc.keyFunctions.length > 0) {
        markdown += `#### 🔧 Key Functions\n\n`
        doc.keyFunctions.forEach((func) => {
          markdown += `##### \`${func.name}\`\n\n`
          markdown += `${func.description}\n\n`

          if (func.parameters.length > 0) {
            markdown += `**Parameters:**\n\n`
            func.parameters.forEach((param) => {
              markdown += `- \`${param.name}\` (\`${param.type}\`) - ${param.description}\n`
            })
            markdown += `\n`
          }

          markdown += `**Returns**: \`${func.returns.type}\` - ${func.returns.description}\n\n`

          if (func.examples && func.examples.length > 0) {
            markdown += `**Example:**\n\n`
            func.examples.forEach((example) => {
              markdown += `\`\`\`javascript\n${example}\n\`\`\`\n\n`
            })
          }
        })
      }

      if (doc.classes.length > 0) {
        markdown += `#### 🏗️ Classes\n\n`
        doc.classes.forEach((cls) => {
          markdown += `##### \`${cls.name}\`\n\n`
          markdown += `${cls.description}\n\n`

          if (cls.properties.length > 0) {
            markdown += `**Properties:**\n\n`
            cls.properties.forEach((prop) => {
              markdown += `- \`${prop.name}\` (\`${prop.type}\`) - ${prop.description}\n`
            })
            markdown += `\n`
          }

          if (cls.methods.length > 0) {
            markdown += `**Methods:**\n\n`
            cls.methods.forEach((method) => {
              markdown += `###### \`${method.name}\`\n\n`
              markdown += `${method.description}\n\n`

              if (method.parameters.length > 0) {
                markdown += `**Parameters:**\n\n`
                method.parameters.forEach((param) => {
                  markdown += `- \`${param.name}\` (\`${param.type}\`) - ${param.description}\n`
                })
                markdown += `\n`
              }

              markdown += `**Returns**: \`${method.returns.type}\` - ${method.returns.description}\n\n`
            })
          }
        })
      }

      if (doc.constants.length > 0) {
        markdown += `#### 📊 Constants\n\n`
        doc.constants.forEach((constant) => {
          markdown += `##### \`${constant.name}\`\n\n`
          markdown += `- **Type**: \`${constant.type}\`\n`
          if (constant.value) {
            markdown += `- **Value**: \`${constant.value}\`\n`
          }
          markdown += `- **Description**: ${constant.description}\n\n`
        })
      }

      markdown += `---\n\n`
    })

    markdown += `## 🤝 Contributing\n\n`
    markdown += `This documentation was generated by DocuGenius AI. For the most up-to-date information, please refer to the [source repository](https://github.com/${repositoryFullName}).\n\n`
    markdown += `---\n\n`
    markdown += `*Generated with ❤️ by [DocuGenius](https://github.com/yourusername/docgenius)*`

    return markdown
  }
}

export default OpenAIService
