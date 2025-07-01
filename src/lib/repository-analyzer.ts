import { Octokit } from '@octokit/rest'

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

export class RepositoryAnalyzer {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    })
  }

  async getRepositoryInfo(owner: string, repo: string): Promise<RepositoryInfo> {
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    })

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      language: data.language,
      topics: data.topics || [],
      defaultBranch: data.default_branch,
    }
  }

  async getAllRepositoryFiles(owner: string, repo: string, branch?: string): Promise<GitHubFile[]> {
    const repoInfo = await this.getRepositoryInfo(owner, repo)
    const targetBranch = branch || repoInfo.defaultBranch
    
    const allFiles: GitHubFile[] = []
    
    try {
      // Get the repository tree recursively
      const { data: tree } = await this.octokit.git.getTree({
        owner,
        repo,
        tree_sha: targetBranch,
        recursive: 'true',
      })

      interface TreeItem {
        type?: string
        path?: string
        size?: number
        sha?: string
      }

      // Filter for files (not directories) and code files
      const codeFiles = tree.tree.filter((item: TreeItem) => 
        item.type === 'blob' && 
        item.path && 
        this.isCodeFile(item.path) &&
        item.size && item.size <= 100000 // Max 100KB per file
      )

      // Limit to first 50 files to avoid API limits
      const filesToProcess = codeFiles.slice(0, 50)

      // Fetch content for each file
      for (const file of filesToProcess) {
        if (!file.path || !file.sha) continue

        try {
          const { data: blob } = await this.octokit.git.getBlob({
            owner,
            repo,
            file_sha: file.sha,
          })

          // Decode base64 content
          const content = Buffer.from(blob.content, 'base64').toString('utf-8')
          
          allFiles.push({
            name: file.path.split('/').pop() || file.path,
            path: file.path,
            content,
            language: this.getLanguageFromPath(file.path),
            size: file.size || 0,
            sha: file.sha,
          })
        } catch (error) {
          console.error(`Failed to fetch content for ${file.path}:`, error)
          // Continue with other files
        }
      }

    } catch (error) {
      console.error('Error fetching repository files:', error)
      throw new Error(`Failed to fetch repository files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return allFiles
  }

  private isCodeFile(filePath: string): boolean {
    const path = filePath.toLowerCase()
    
    // Exclude certain directories and files
    const excludePatterns = [
      'node_modules/',
      '.git/',
      'dist/',
      'build/',
      'coverage/',
      '.next/',
      'out/',
      'public/',
      'assets/',
      'images/',
      'img/',
      'fonts/',
      '.lock',
      'package-lock.json',
      'yarn.lock',
      '.env',
      '.env.local',
      '.env.example',
      'docker',
      '.docker',
      'readme.md',
      'license',
      'changelog',
      '.gitignore',
      '.gitattributes',
      '.vscode/',
      '.idea/',
      'docs/',
      'documentation/',
    ]

    if (excludePatterns.some(pattern => path.includes(pattern))) {
      return false
    }

    // Include specific file extensions
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.pyx', '.pyi',
      '.java', '.kt', '.scala',
      '.go', '.rs', '.rb',
      '.php', '.cpp', '.c', '.h', '.hpp',
      '.cs', '.fs', '.vb',
      '.swift', '.m', '.mm',
      '.dart', '.lua', '.r',
      '.sql', '.sh', '.bat', '.ps1',
      '.html', '.htm', '.css', '.scss', '.sass', '.less',
      '.vue', '.svelte', '.astro',
      '.json', '.xml', '.yaml', '.yml', '.toml',
      '.graphql', '.gql',
      '.proto', '.thrift',
      '.tf', '.hcl',
      '.dockerfile',
      '.makefile',
      'makefile',
      '.cmake',
      '.gradle',
      '.maven',
      '.sbt',
      '.cargo',
    ]

    return codeExtensions.some(ext => 
      path.endsWith(ext) || 
      (ext === 'makefile' && path.endsWith('makefile')) ||
      (ext === '.dockerfile' && path.includes('dockerfile'))
    )
  }

  private getLanguageFromPath(filePath: string): string {
    const extension = '.' + filePath.split('.').pop()?.toLowerCase()
    const filename = filePath.split('/').pop()?.toLowerCase()

    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.pyx': 'python',
      '.pyi': 'python',
      '.java': 'java',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.fs': 'fsharp',
      '.vb': 'vbnet',
      '.swift': 'swift',
      '.m': 'objectivec',
      '.mm': 'objectivec',
      '.dart': 'dart',
      '.lua': 'lua',
      '.r': 'r',
      '.sql': 'sql',
      '.sh': 'shell',
      '.bat': 'batch',
      '.ps1': 'powershell',
      '.html': 'html',
      '.htm': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.astro': 'astro',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.graphql': 'graphql',
      '.gql': 'graphql',
      '.proto': 'protobuf',
      '.thrift': 'thrift',
      '.tf': 'terraform',
      '.hcl': 'hcl',
      '.cmake': 'cmake',
    }

    // Special filename handling
    if (filename === 'dockerfile' || filename?.includes('dockerfile')) {
      return 'dockerfile'
    }
    if (filename === 'makefile' || filename?.includes('makefile')) {
      return 'makefile'
    }
    if (filename?.includes('.gradle')) {
      return 'gradle'
    }

    return languageMap[extension] || 'text'
  }
}

export default RepositoryAnalyzer
