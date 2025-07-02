"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { BookOpen, Github, FileText, LogOut, Download, Eye, Trash2, Clock, Home, Settings, HelpCircle, Menu, X } from "lucide-react"

// Import professional documentation CSS
import '../../styles/documentation-theme.css'
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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [documentations, setDocumentations] = useState<SavedDocumentation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<SavedDocumentation | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return // Still loading
    if (!session) {
      router.push("/auth/signin") // Not logged in
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

  if (!session) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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
            <button
              className="bg-blue-50 text-blue-700 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
            >
              <Home className="text-blue-500 mr-3 flex-shrink-0 h-5 w-5" />
              Dashboard
            </button>
            
            <button
              onClick={() => router.push("/repositories")}
              className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
            >
              <Github className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
              Repositories
            </button>
            
            <button
              onClick={() => router.push("/showcase")}
              className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
            >
              <Eye className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
              Demo
            </button>
            
            <div className="pt-4">
              <div className="px-3 mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Account
                </p>
              </div>
              
              <button 
                className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
                title="Settings"
              >
                <Settings className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
                Settings
              </button>
              
              <button 
                className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
                title="Help"
              >
                <HelpCircle className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
                Help
              </button>
            </div>
          </nav>
          
          {/* User Profile */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image 
                  src={session.user?.image || "/default-avatar.png"} 
                  alt={session.user?.name || "User"} 
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
              </div>
              <button 
                onClick={() => signOut()}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button and header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">DocuGenius</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image 
                src={session.user?.image || "/default-avatar.png"} 
                alt={session.user?.name || "User"} 
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={() => signOut()}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
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
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-blue-50 text-blue-700 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
                  >
                    <Home className="text-blue-500 mr-3 flex-shrink-0 h-5 w-5" />
                    Dashboard
                  </button>
                  
                  <button
                    onClick={() => {
                      router.push("/repositories")
                      setMobileMenuOpen(false)
                    }}
                    className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
                  >
                    <Github className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
                    Repositories
                  </button>
                  
                  <button
                    onClick={() => {
                      router.push("/showcase")
                      setMobileMenuOpen(false)
                    }}
                    className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
                  >
                    <Eye className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
                    Demo
                  </button>
                  
                  <div className="pt-4">
                    <div className="px-3 mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Account
                      </p>
                    </div>
                    
                    <button 
                      className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
                      title="Settings"
                    >
                      <Settings className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
                      Settings
                    </button>
                    
                    <button 
                      className="text-gray-700 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-lg w-full"
                      title="Help"
                    >
                      <HelpCircle className="text-gray-400 mr-3 flex-shrink-0 h-5 w-5" />
                      Help
                    </button>
                  </div>
                </nav>

                {/* Mobile User Profile */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image 
                        src={session.user?.image || "/default-avatar.png"} 
                        alt={session.user?.name || "User"} 
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
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

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome back, {session.user?.name?.split(" ")[0]}
              </h1>
              <p className="text-gray-600">
                Manage your documentation projects and generate new documentation for your repositories.
              </p>
            </div>

            {/* Enhanced Stats Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
                <p className="text-sm text-gray-600">Your documentation activity at a glance</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gray-900">{documentations.length}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Documentation Files</p>
                    <p className="text-xs text-gray-500">Total generated documents</p>
                  </div>
                </div>
                
                <div className="text-center border-l border-r border-gray-200">
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {new Set(documentations.map(doc => doc.repository.fullName)).size}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Connected Repositories</p>
                    <p className="text-xs text-gray-500">Unique GitHub repositories</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {documentations.reduce((sum, doc) => sum + doc.filesAnalyzed, 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Files Analyzed</p>
                    <p className="text-xs text-gray-500">Total code files processed</p>
                  </div>
                </div>
              </div>
              
              {documentations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Latest documentation generated on{' '}
                      <span className="font-medium text-gray-900">
                        {new Date(Math.max(...documentations.map(doc => new Date(doc.generatedAt).getTime()))).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="text-gray-600">
                      Average {Math.round(documentations.reduce((sum, doc) => sum + doc.filesAnalyzed, 0) / documentations.length)} files per project
                    </span>
                  </div>
                </div>
              )}
            </div>

        {/* Documentation Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Documentation</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{documentations.length} documentation files</span>
                {documentations.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{new Set(documentations.map(doc => doc.repository.fullName)).size} repositories</span>
                  </>
                )}
              </div>
            </div>
            <button 
              onClick={fetchDocumentations}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {documentations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Welcome to DocuGenius
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  You haven&apos;t generated any documentation yet. Get started by connecting to one of your GitHub repositories and let our AI create comprehensive documentation for your projects.
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push("/repositories")}
                    className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Github className="h-5 w-5" />
                    Browse Your Repositories
                  </button>
                  <button 
                    onClick={() => router.push("/showcase")}
                    className="w-full bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Eye className="h-5 w-5" />
                    View Demo Documentation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {documentations.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {doc.repository.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {doc.repository.fullName}
                          </p>
                        </div>
                      </div>
                      
                      {doc.repository.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {doc.repository.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{doc.filesAnalyzed} files</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(doc.generatedAt).toLocaleDateString()}</span>
                        </div>
                        {doc.repository.language && (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>{doc.repository.language}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-6">
                      <button
                        onClick={() => {
                          setSelectedDoc(doc)
                          setShowModal(true)
                        }}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                        title="View Documentation"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadMarkdown(doc)}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                        title="Download Documentation"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteDocumentation(doc.id)}
                        className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
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
                          className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                      {doc.repository.topics.length > 5 && (
                        <span className="px-2.5 py-1 text-xs text-gray-500 bg-gray-50 rounded-full">
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

        {/* Modern Documentation Modal */}
        {showModal && selectedDoc && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedDoc.repository.name}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{selectedDoc.repository.fullName}</span>
                        <span>•</span>
                        <span>{selectedDoc.filesAnalyzed} files analyzed</span>
                        <span>•</span>
                        <span>{new Date(selectedDoc.generatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                <div className="documentation-container prose prose-lg max-w-none">
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
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Generated on {new Date(selectedDoc.generatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadMarkdown(selectedDoc)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Download Markdown
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  )
}
