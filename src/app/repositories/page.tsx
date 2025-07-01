"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { 
  BookOpen, 
  Search, 
  Star, 
  GitFork, 
  Clock, 
  Lock, 
  Globe, 
  ArrowLeft,
  ExternalLink,
  FileText,
  Code
} from "lucide-react"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  topics: string[]
  owner: {
    login: string
    avatar_url: string
  }
}

interface RepositoriesResponse {
  repositories: Repository[]
  pagination: {
    page: number
    per_page: number
    total: number
  }
}



export default function Repositories() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("updated")
  const [filterType, setFilterType] = useState("owner")
  
  // Documentation generation state
  const [generatingDocs, setGeneratingDocs] = useState<number | null>(null)
  const [documentationError, setDocumentationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        sort: sortBy,
        type: filterType,
        per_page: "50"
      })

      const response = await fetch(`/api/repositories?${params}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch repositories")
      }

      const data: RepositoriesResponse = await response.json()
      setRepositories(data.repositories)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [sortBy, filterType])

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchRepositories()
  }, [session, status, router, fetchRepositories])

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.language?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const getLanguageColor = (language: string | null) => {
    const colors: { [key: string]: string } = {
      JavaScript: "#f1e05a",
      TypeScript: "#3178c6",
      Python: "#3572A5",
      Java: "#b07219",
      "C++": "#f34b7d",
      C: "#555555",
      Go: "#00ADD8",
      Rust: "#dea584",
      PHP: "#4F5D95",
      Ruby: "#701516",
      Swift: "#fa7343",
      Kotlin: "#A97BFF",
      Dart: "#00B4AB",
      HTML: "#e34c26",
      CSS: "#1572B6"
    }
    return colors[language || ""] || "#6b7280"
  }

  const generateDocumentation = async (repository: Repository) => {
    try {
      setGeneratingDocs(repository.id)
      setDocumentationError(null)
      setSuccessMessage(null)
      
      const response = await fetch('/api/generate-documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryId: repository.id,
          repositoryName: repository.name,
          repositoryFullName: repository.full_name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate documentation')
      }

      // Just consume the response without using the result
      await response.json()
      
      // Show success message instead of modal
      setSuccessMessage(`✅ Documentation for ${repository.name} has been generated successfully! You can view it from your dashboard.`)
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
    } catch (err) {
      setDocumentationError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setGeneratingDocs(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading repositories...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">Repositories</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                title="Sort repositories by"
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="pushed">Recently Pushed</option>
                <option value="full_name">Name</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                title="Filter repository type"
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="owner">Your Repositories</option>
                <option value="all">All Repositories</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchRepositories}
              className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Repositories Grid */}
        {filteredRepositories.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No repositories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? "Try adjusting your search criteria." : "You don't have any repositories yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRepositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                      {repo.private ? <Lock className="h-4 w-4 text-gray-400" /> : <Globe className="h-4 w-4 text-gray-400" />}
                      {repo.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {repo.description || "No description available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {repo.language && (
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                      />
                      <span>{repo.language}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{repo.stargazers_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GitFork className="h-4 w-4" />
                    <span>{repo.forks_count}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>Updated {formatDate(repo.updated_at)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(repo.html_url, "_blank")}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="View on GitHub"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => generateDocumentation(repo)}
                      disabled={generatingDocs === repo.id}
                      className={`p-2 rounded-lg transition-colors ${
                        generatingDocs === repo.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                      title="Generate Documentation"
                    >
                      {generatingDocs === repo.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {repo.topics.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {repo.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                    {repo.topics.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                        +{repo.topics.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {documentationError && (
          <div className="fixed top-4 right-4 z-50 max-w-md p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-500">⚠️</div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Documentation Generation Failed
                </p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {documentationError}
                </p>
                <button
                  onClick={() => setDocumentationError(null)}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 max-w-md p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-green-500">✅</div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Documentation Generated Successfully!
                </p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  {successMessage.replace('✅ ', '')}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
