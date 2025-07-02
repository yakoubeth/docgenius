"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { 
  BookOpen, 
  Github, 
  FileText, 
  LogOut, 
  Download, 
  Eye, 
  Trash2, 
  Clock, 
  Home, 
  Menu, 
  X,
  Search, 
  Star, 
  GitFork, 
  Lock, 
  Globe, 
  ExternalLink,
  Code
} from "lucide-react"

// Import professional documentation CSS
import '../../styles/documentation-theme.css'
import '../../styles/dashboard-mobile.css'
import '../../styles/repositories.css'
import 'highlight.js/styles/github.css'

interface SavedDocumentation {
  id: string
  title: string
  markdownContent: string
  structuredData: Record<string, unknown>
  filesAnalyzed: number
  generatedAt: string
  repository: {
    id: number
    name: string
    fullName: string
    description: string | null
    language: string | null
    topics: string[]
  }
}

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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Dashboard state
  const [documentations, setDocumentations] = useState<SavedDocumentation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<SavedDocumentation | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Navigation state
  const [activeView, setActiveView] = useState<'dashboard' | 'repositories'>('dashboard')
  
  // Repositories state
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [repositoriesLoading, setRepositoriesLoading] = useState(false)
  const [repositoriesError, setRepositoriesError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("updated")
  const [filterType, setFilterType] = useState("owner")
  
  // Documentation generation state
  const [generatingDocs, setGeneratingDocs] = useState<number | null>(null)
  const [documentationError, setDocumentationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchDocumentations()
  }, [session, status, router])

  const fetchDocumentations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documentations')
      if (response.ok) {
        const data = await response.json()
        setDocumentations(data.documentations)
      }
    } catch (error) {
      console.error('Error fetching documentations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRepositories = useCallback(async () => {
    try {
      setRepositoriesLoading(true)
      setRepositoriesError(null)
      
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
      setRepositoriesError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setRepositoriesLoading(false)
    }
  }, [sortBy, filterType])

  useEffect(() => {
    if (activeView === 'repositories' && session) {
      fetchRepositories()
    }
  }, [activeView, session, fetchRepositories])

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

      await response.json()
      
      setSuccessMessage(`✅ Documentation for ${repository.name} has been generated successfully! You can view it from your dashboard.`)
      
      setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      
      // Refresh documentations if we're on dashboard view
      if (activeView === 'dashboard') {
        fetchDocumentations()
      }
    } catch (err) {
      setDocumentationError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setGeneratingDocs(null)
    }
  }

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

  const getLanguageClass = (language: string | null) => {
    if (!language) return "language-default"
    
    const languageMap: { [key: string]: string } = {
      JavaScript: "language-javascript",
      TypeScript: "language-typescript",
      Python: "language-python",
      Java: "language-java",
      "C++": "language-cpp",
      C: "language-c",
      Go: "language-go",
      Rust: "language-rust",
      PHP: "language-php",
      Ruby: "language-ruby",
      Swift: "language-swift",
      Kotlin: "language-kotlin",
      Dart: "language-dart",
      HTML: "language-html",
      CSS: "language-css"
    }
    return languageMap[language] || "language-default"
  }

  const deleteDocumentation = async (id: string) => {
    try {
      const response = await fetch(`/api/documentations?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setDocumentations(prev => prev.filter(doc => doc.id !== id))
      }
    } catch (error) {
      console.error('Error deleting documentation:', error)
    }
  }

  const downloadMarkdown = (doc: SavedDocumentation) => {
    const blob = new Blob([doc.markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.repository.name}-documentation.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleNavigation = (path: string | null, view?: 'dashboard' | 'repositories') => {
    if (view) {
      setActiveView(view)
      setMobileMenuOpen(false)
    } else if (path) {
      router.push(path)
      setMobileMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    setMobileMenuOpen(false)
    await signOut({ callbackUrl: "/" })
  }

  // Navigation items configuration
  const navigationItems = [
    { label: 'Dashboard', icon: Home, view: 'dashboard' as const, active: activeView === 'dashboard' },
    { label: 'Repositories', icon: Github, view: 'repositories' as const, active: activeView === 'repositories' },
  ]

  // Render navigation items
  const renderNavItems = (items: typeof navigationItems) => (
    <>
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => handleNavigation(null, item.view)}
          className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full ${
            item.active
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title={item.label}
        >
          <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
            item.active ? 'text-blue-500' : 'text-gray-400'
          }`} />
          {item.label}
        </button>
      ))}
    </>
  )

  // User profile component
  const UserProfile = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex items-center ${isMobile ? 'gap-3' : 'w-full'}`}>
      <div className={`rounded-full overflow-hidden ${isMobile ? 'w-10 h-10' : 'w-8 h-8'}`}>
        <Image 
          src={session?.user?.image || "/default-avatar.png"} 
          alt={session?.user?.name || "User"} 
          width={isMobile ? 40 : 32}
          height={isMobile ? 40 : 32}
          className="w-full h-full object-cover"
        />
      </div>
      <div className={isMobile ? 'flex-1' : 'ml-3 flex-1'}>
        <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
        <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
      </div>
      {!isMobile && (
        <button 
          onClick={async () => await signOut({ callbackUrl: "/" })}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  // Documentation Modal component
  const DocumentationModal = () => {
    if (!showModal || !selectedDoc) return null

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200 mt-2 sm:mt-0">
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {selectedDoc.repository.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span className="truncate">{selectedDoc.repository.fullName}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{selectedDoc.filesAnalyzed} files analyzed</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{new Date(selectedDoc.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-160px)]">
            <div className="documentation-container prose prose-sm sm:prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 mt-8">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-gray-700 mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  img: ({ src, alt }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={alt} className="rounded-lg shadow-sm max-w-full h-auto my-4" />
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono text-sm" {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => (
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto my-4 text-sm">
                      {children}
                    </pre>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="bg-gray-50 text-gray-900 px-6 py-3 text-left font-semibold border-b border-gray-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-6 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      {children}
                    </td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 bg-blue-50 p-4 my-4 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 transition-colors"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {selectedDoc.markdownContent}
              </ReactMarkdown>
            </div>
          </div>
          
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-gray-500">
                Generated on {new Date(selectedDoc.generatedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => downloadMarkdown(selectedDoc)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium"
                >
                  Download Markdown
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Repositories Content component
  const RepositoriesContent = () => {
    if (repositoriesLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading repositories...</p>
          </div>
        </div>
      )
    }

    if (repositoriesError) {
      return (
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{repositoriesError}</p>
          <button 
            onClick={fetchRepositories}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}
        
        {documentationError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {documentationError}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Sort repositories by"
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="pushed">Recently Pushed</option>
                <option value="full_name">Name</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Filter repository type"
              >
                <option value="owner">My Repositories</option>
                <option value="member">Member Of</option>
              </select>
            </div>
          </div>
        </div>

        {/* Repository List */}
        <div className="grid gap-4">
          {filteredRepositories.map((repo) => (
            <div key={repo.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {repo.private ? (
                        <Lock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Globe className="h-4 w-4 text-green-500" />
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {repo.name}
                      </h3>
                    </div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title={`Open ${repo.name} on GitHub`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  
                  {repo.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${getLanguageClass(repo.language)}`} />
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
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Updated {formatDate(repo.updated_at)}</span>
                    </div>
                  </div>

                  {repo.topics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {repo.topics.slice(0, 5).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                      {repo.topics.length > 5 && (
                        <span className="px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-full">
                          +{repo.topics.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="ml-6 flex-shrink-0">
                  <button
                    onClick={() => generateDocumentation(repo)}
                    disabled={generatingDocs === repo.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingDocs === repo.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Generate Docs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRepositories.length === 0 && !repositoriesLoading && (
          <div className="text-center py-16">
            <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms or filters." : "No repositories match the current filters."}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">DocuGenius</span>
          </div>
          
          {/* Navigation */}
          <nav className="mt-8 flex-1 px-3 space-y-2">
            {renderNavItems(navigationItems)}
          </nav>
          
          {/* User Profile */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">DocuGenius</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Content - with top padding to account for fixed header */}
        <div className="pt-16">
          <main className="min-h-screen">
            <div className="py-4 sm:py-6 px-4 sm:px-6 max-w-7xl mx-auto w-full">
              {/* Header */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  {activeView === 'dashboard' 
                    ? `Welcome back, ${session.user?.name?.split(" ")[0]}` 
                    : 'Your Repositories'
                  }
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {activeView === 'dashboard'
                    ? 'Manage your documentation projects and generate new documentation for your repositories.'
                    : 'Browse and generate documentation for your GitHub repositories.'
                  }
                </p>
              </div>

              {/* Content based on active view */}
              {activeView === 'dashboard' ? (
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Your Documentation</h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <span>{documentations.length} documentation files</span>
                      {documentations.length > 0 && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>{new Set(documentations.map(doc => doc.repository.fullName)).size} repositories</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={fetchDocumentations}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>

                {documentations.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                        Welcome to DocuGenius
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                        You haven&apos;t generated any documentation yet. Get started by connecting to one of your GitHub repositories and let our AI create comprehensive documentation for your projects.
                      </p>
                      <div className="space-y-3">
                        <button 
                          onClick={() => router.push("/repositories")}
                          className="w-full bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                          Browse Your Repositories
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {documentations.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:border-gray-300 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                  {doc.repository.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 truncate">
                                  {doc.repository.fullName}
                                </p>
                              </div>
                            </div>
                            
                            {doc.repository.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">
                                {doc.repository.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{doc.filesAnalyzed} files</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{new Date(doc.generatedAt).toLocaleDateString()}</span>
                              </div>
                              {doc.repository.language && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                                  <span>{doc.repository.language}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:ml-6">
                            <button
                              onClick={() => {
                                setSelectedDoc(doc)
                                setShowModal(true)
                              }}
                              className="p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                              title="View Documentation"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => downloadMarkdown(doc)}
                              className="p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                              title="Download Documentation"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteDocumentation(doc.id)}
                              className="p-2 sm:p-2.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete Documentation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {doc.repository.topics.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {doc.repository.topics.slice(0, 5).map((topic) => (
                              <span
                                key={topic}
                                className="px-2 sm:px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                            {doc.repository.topics.length > 5 && (
                              <span className="px-2 sm:px-2.5 py-1 text-xs text-gray-500 bg-gray-50 rounded-full">
                                +{doc.repository.topics.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              ) : (
                <RepositoriesContent />
              )}
            </div>
          </main>
        </div>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
              <div className="flex flex-col h-full">
                {/* Mobile Logo */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-gray-900">DocuGenius</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-2">
                  {renderNavItems(navigationItems)}
                </nav>

                {/* Mobile User Profile */}
                <div className="border-t border-gray-200 p-4">
                  <UserProfile isMobile />
                  <button 
                    onClick={handleSignOut}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Main Content */}
      <div className="hidden lg:block lg:pl-64">
        <main className="min-h-screen">
          <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                {activeView === 'dashboard' 
                  ? `Welcome back, ${session.user?.name?.split(" ")[0]}` 
                  : 'Your Repositories'
                }
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {activeView === 'dashboard'
                  ? 'Manage your documentation projects and generate new documentation for your repositories.'
                  : 'Browse and generate documentation for your GitHub repositories.'
                }
              </p>
            </div>

            {/* Content based on active view */}
            {activeView === 'dashboard' ? (
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Your Documentation</h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <span>{documentations.length} documentation files</span>
                    {documentations.length > 0 && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Set(documentations.map(doc => doc.repository.fullName)).size} repositories</span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={fetchDocumentations}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {documentations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 lg:p-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                      Welcome to DocuGenius
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                      You haven&apos;t generated any documentation yet. Get started by connecting to one of your GitHub repositories and let our AI create comprehensive documentation for your projects.
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => router.push("/repositories")}
                        className="w-full bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                        Browse Your Repositories
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {documentations.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:border-gray-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                {doc.repository.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {doc.repository.fullName}
                              </p>
                            </div>
                          </div>
                          
                          {doc.repository.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">
                              {doc.repository.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{doc.filesAnalyzed} files</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{new Date(doc.generatedAt).toLocaleDateString()}</span>
                            </div>
                            {doc.repository.language && (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500" />
                                <span>{doc.repository.language}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:ml-6">
                          <button
                            onClick={() => {
                              setSelectedDoc(doc)
                              setShowModal(true)
                            }}
                            className="p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                            title="View Documentation"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => downloadMarkdown(doc)}
                            className="p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                            title="Download Documentation"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDocumentation(doc.id)}
                            className="p-2 sm:p-2.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Documentation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {doc.repository.topics.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {doc.repository.topics.slice(0, 5).map((topic) => (
                            <span
                              key={topic}
                              className="px-2 sm:px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                          {doc.repository.topics.length > 5 && (
                            <span className="px-2 sm:px-2.5 py-1 text-xs text-gray-500 bg-gray-50 rounded-full">
                              +{doc.repository.topics.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            ) : (
              <RepositoriesContent />
            )}
          </div>
        </main>
      </div>

      <DocumentationModal />
    </div>
  )
}
