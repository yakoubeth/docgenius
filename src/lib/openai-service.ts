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
      const fileContents = files.map(file => `=== ${file.path} (${file.language}) ===\n${file.content}`).join('\n\n')
      
      const userPrompt = `You are an expert software engineer and technical writer. Analyze this complete codebase for "${repositoryName}" and generate the most comprehensive, detailed documentation possible.

${repositoryDescription ? `Project Description: ${repositoryDescription}` : ''}

CODEBASE FILES:
${fileContents}

Please provide an extremely detailed analysis in JSON format with the following structure:
{
  "overview": "Comprehensive project overview, what it does, main purpose, target audience, key features, and value proposition",
  "architecture": "Detailed explanation of the project architecture, design patterns, folder structure, component relationships, data flow, and technical decisions",
  "gettingStarted": "Complete step-by-step guide for developers to set up and start using the project (prerequisites, installation, configuration, first run, troubleshooting)",
  "apiReference": "Complete API documentation with all endpoints, functions, parameters, return values, examples, and usage patterns",
  "projectStructure": "In-depth explanation of the folder/file organization, what each part does, and how they work together",
  "keyComponents": "Detailed analysis of the most important files/modules, their roles, responsibilities, and how they interact",
  "usageExamples": "Extensive practical examples showing how to use all main features, edge cases, and best practices",
  "fileDocumentations": {
    "filename.ext": {
      "summary": "What this file does and its role in the project",
      "purpose": "Why this file exists and how it fits into the bigger picture",
      "keyFunctions": [...detailed function documentation...],
      "classes": [...detailed class documentation...],
      "constants": [...detailed constant documentation...],
      "dependencies": ["list of files/modules this depends on"]
    }
  }
}

Requirements for PERFECT documentation:
- Explain every complex concept in simple, clear terms
- Provide multiple practical examples for each feature
- Focus extensively on how developers can actually use and extend the code
- Identify ALL main entry points and key workflows
- Explain ALL configuration and environment setup requirements
- Document EVERY API, interface, function, and important code element thoroughly
- Include performance considerations and best practices
- Add troubleshooting tips and common pitfalls
- Explain the reasoning behind architectural decisions
- Provide clear code examples that actually work
- Make it actionable for both beginners and experienced developers

Make this the most comprehensive and useful documentation possible.`

      const response = await this.client.chat.completions.create({
        model: 'o3-2025-04-16',
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 32000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response content from OpenAI')
      }

      const analysis = JSON.parse(content) as ProjectAnalysis
      return analysis

    } catch (error) {
      console.error('Error analyzing codebase with OpenAI o3:', error)
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
    markdown += `> 🤖 **AI-Generated Documentation** powered by OpenAI o3\n`
    markdown += `> \n> 📊 **Analysis**: ${filesAnalyzed} files analyzed comprehensively\n`
    markdown += `> 📅 **Generated**: ${new Date().toLocaleDateString()}\n`
    markdown += `> 🔗 **Repository**: [\`${repositoryFullName}\`](https://github.com/${repositoryFullName})\n\n`
    markdown += `---\n\n`

    // Table of Contents
    markdown += `## 📚 Table of Contents\n\n`
    markdown += `1. [🚀 Project Overview](#-project-overview)\n`
    markdown += `2. [🏗️ Architecture](#️-architecture)\n`
    markdown += `3. [🛠️ Getting Started](#️-getting-started)\n`
    markdown += `4. [📁 Project Structure](#-project-structure)\n`
    markdown += `5. [🔑 Key Components](#-key-components)\n`
    markdown += `6. [📖 API Reference](#-api-reference)\n`
    markdown += `7. [💡 Usage Examples](#-usage-examples)\n`
    markdown += `8. [📄 File Documentation](#-file-documentation)\n\n`
    markdown += `---\n\n`

    // Project Overview
    markdown += `## 🚀 Project Overview\n\n`
    markdown += `${analysis.overview}\n\n`

    // Architecture
    markdown += `## 🏗️ Architecture\n\n`
    markdown += `${analysis.architecture}\n\n`

    // Getting Started
    markdown += `## 🛠️ Getting Started\n\n`
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
            markdown += `**Examples:**\n\n`
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
    markdown += `This comprehensive documentation was generated by DocuGenius AI using OpenAI's o3 model. \n\n`
    markdown += `For the most up-to-date information, please refer to the [source repository](https://github.com/${repositoryFullName}).\n\n`
    markdown += `---\n\n`
    markdown += `*Generated with ❤️ by [DocuGenius](https://github.com/yourusername/docgenius) • Powered by OpenAI o3*`

    return markdown
  }
}

export default OpenAIService
