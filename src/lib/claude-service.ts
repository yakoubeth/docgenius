import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CodeAnalysisRequest {
  fileContent: string;
  fileName: string;
  language: string;
  projectContext?: string;
}

export interface DocumentationResult {
  summary: string;
  functions: Array<{
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    returns: {
      type: string;
      description: string;
    };
    examples?: string[];
  }>;
  classes: Array<{
    name: string;
    description: string;
    methods: Array<{
      name: string;
      description: string;
      parameters: Array<{
        name: string;
        type: string;
        description: string;
      }>;
      returns: {
        type: string;
        description: string;
      };
    }>;
    properties: Array<{
      name: string;
      type: string;
      description: string;
    }>;
  }>;
  constants: Array<{
    name: string;
    type: string;
    description: string;
    value?: string;
  }>;
  usage: {
    installation?: string;
    quickStart: string;
    examples: string[];
  };
}

export class ClaudeService {
  private static instance: ClaudeService;

  public static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService();
    }
    return ClaudeService.instance;
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<DocumentationResult> {
    const prompt = this.buildAnalysisPrompt(request);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        system: `You are an expert code documentation generator. Analyze the provided code and generate comprehensive, clear, and accurate documentation. Focus on:

1. Understanding the code's purpose and functionality
2. Documenting all public functions, classes, and methods
3. Explaining parameters, return values, and side effects
4. Providing practical usage examples
5. Identifying and explaining any patterns or best practices
6. Creating clear, concise descriptions that help developers understand and use the code

Return your response as a valid JSON object matching the DocumentationResult interface structure. Ensure all strings are properly escaped and the JSON is valid.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          // Extract JSON from the response if it's wrapped in markdown code blocks
          const jsonMatch = content.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          const jsonString = jsonMatch ? jsonMatch[1] : content.text;
          
          const result = JSON.parse(jsonString) as DocumentationResult;
          return result;
        } catch (parseError) {
          console.error('Failed to parse Claude response as JSON:', parseError);
          console.error('Response content:', content.text);
          
          // Fallback: create a basic documentation structure
          return this.createFallbackDocumentation(request, content.text);
        }
      }

      throw new Error('Unexpected response format from Claude');
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new Error('Failed to analyze code with Claude AI');
    }
  }

  private buildAnalysisPrompt(request: CodeAnalysisRequest): string {
    return `Please analyze the following ${request.language} code file and generate comprehensive documentation.

File: ${request.fileName}
Language: ${request.language}
${request.projectContext ? `Project Context: ${request.projectContext}` : ''}

Code to analyze:
\`\`\`${request.language}
${request.fileContent}
\`\`\`

Please provide a detailed analysis and documentation in JSON format following this structure:

{
  "summary": "Brief overview of what this file/module does",
  "functions": [
    {
      "name": "functionName",
      "description": "What this function does",
      "parameters": [
        {
          "name": "paramName",
          "type": "paramType",
          "description": "What this parameter is for"
        }
      ],
      "returns": {
        "type": "returnType",
        "description": "What is returned"
      },
      "examples": ["code example showing usage"]
    }
  ],
  "classes": [
    {
      "name": "ClassName",
      "description": "What this class represents",
      "methods": [
        {
          "name": "methodName",
          "description": "What this method does",
          "parameters": [...],
          "returns": {...}
        }
      ],
      "properties": [
        {
          "name": "propertyName",
          "type": "propertyType",
          "description": "What this property represents"
        }
      ]
    }
  ],
  "constants": [
    {
      "name": "CONSTANT_NAME",
      "type": "constantType",
      "description": "What this constant represents",
      "value": "actual value if applicable"
    }
  ],
  "usage": {
    "installation": "How to install/import this module (if applicable)",
    "quickStart": "Basic usage example",
    "examples": ["More detailed usage examples"]
  }
}

Focus on:
- Accuracy and clarity
- Practical examples
- Complete parameter and return type information
- Best practices and common use cases
- Any important notes about behavior, side effects, or limitations

Return only the JSON object, no additional text or markdown formatting around it.`;
  }

  private createFallbackDocumentation(request: CodeAnalysisRequest, analysisText: string): DocumentationResult {
    return {
      summary: `Analysis of ${request.fileName}: ${analysisText.substring(0, 200)}...`,
      functions: [],
      classes: [],
      constants: [],
      usage: {
        quickStart: `// Import and use ${request.fileName}\n// See the analysis below for details`,
        examples: []
      }
    };
  }

  async generateProjectDocumentation(files: CodeAnalysisRequest[]): Promise<{
    overview: string;
    fileDocumentations: { [fileName: string]: DocumentationResult };
    apiReference: string;
    gettingStarted: string;
  }> {
    // Analyze each file individually
    const fileDocumentations: { [fileName: string]: DocumentationResult } = {};
    
    for (const file of files) {
      try {
        fileDocumentations[file.fileName] = await this.analyzeCode(file);
      } catch (error) {
        console.error(`Failed to analyze ${file.fileName}:`, error);
        fileDocumentations[file.fileName] = this.createFallbackDocumentation(file, 'Analysis failed');
      }
    }

    // Generate project overview
    const projectOverviewPrompt = `Based on the following files and their analysis, generate a comprehensive project overview:

Files analyzed: ${files.map(f => f.fileName).join(', ')}

Project structure and purpose:
${files.map(f => `${f.fileName}: ${f.language}`).join('\n')}

Please provide:
1. A project overview (what the project does, its main purpose)
2. Key features and capabilities
3. Architecture overview
4. Getting started guide
5. API reference summary

Focus on helping developers understand what this project is about and how to get started with it.`;

    try {
      const overviewResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: projectOverviewPrompt
          }
        ]
      });

      const overviewContent = overviewResponse.content[0];
      const overview = overviewContent.type === 'text' ? overviewContent.text : 'Project overview generation failed';

      return {
        overview,
        fileDocumentations,
        apiReference: this.generateApiReference(fileDocumentations),
        gettingStarted: this.generateGettingStarted(fileDocumentations)
      };
    } catch (error) {
      console.error('Error generating project overview:', error);
      return {
        overview: 'Failed to generate project overview',
        fileDocumentations,
        apiReference: this.generateApiReference(fileDocumentations),
        gettingStarted: this.generateGettingStarted(fileDocumentations)
      };
    }
  }

  private generateApiReference(fileDocumentations: { [fileName: string]: DocumentationResult }): string {
    let apiRef = '# API Reference\n\n';
    
    Object.entries(fileDocumentations).forEach(([fileName, doc]) => {
      apiRef += `## ${fileName}\n\n`;
      apiRef += `${doc.summary}\n\n`;
      
      if (doc.functions.length > 0) {
        apiRef += '### Functions\n\n';
        doc.functions.forEach(func => {
          apiRef += `#### ${func.name}\n\n`;
          apiRef += `${func.description}\n\n`;
          if (func.parameters.length > 0) {
            apiRef += '**Parameters:**\n';
            func.parameters.forEach(param => {
              apiRef += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
            });
            apiRef += '\n';
          }
          apiRef += `**Returns:** ${func.returns.type} - ${func.returns.description}\n\n`;
        });
      }
      
      if (doc.classes.length > 0) {
        apiRef += '### Classes\n\n';
        doc.classes.forEach(cls => {
          apiRef += `#### ${cls.name}\n\n`;
          apiRef += `${cls.description}\n\n`;
        });
      }
    });
    
    return apiRef;
  }

  private generateGettingStarted(fileDocumentations: { [fileName: string]: DocumentationResult }): string {
    let gettingStarted = '# Getting Started\n\n';
    
    // Find installation instructions from any file
    const installationInstructions = Object.values(fileDocumentations)
      .map(doc => doc.usage.installation)
      .filter(Boolean)[0];
    
    if (installationInstructions) {
      gettingStarted += '## Installation\n\n';
      gettingStarted += `${installationInstructions}\n\n`;
    }
    
    gettingStarted += '## Quick Start\n\n';
    Object.entries(fileDocumentations).forEach(([fileName, doc]) => {
      if (doc.usage.quickStart) {
        gettingStarted += `### ${fileName}\n\n`;
        gettingStarted += `\`\`\`\n${doc.usage.quickStart}\n\`\`\`\n\n`;
      }
    });
    
    return gettingStarted;
  }
}

export default ClaudeService;
