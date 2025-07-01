"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { BookOpen, Github, Plus, FileText, LogOut, Download, Eye, Trash2, Clock } from "lucide-react"

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800 dark:text-white">DocuGenius</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Image 
                  src={session.user?.image || "/default-avatar.png"} 
                  alt={session.user?.name || "User"} 
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user?.name}
                </span>
              </div>
              <button 
                onClick={() => signOut()}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your documentation projects and generate new documentation for your repositories.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => router.push("/repositories")}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Documentation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Browse your repositories and generate AI-powered documentation
            </p>
          </button>

          <button 
            onClick={() => router.push("/repositories")}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center">
                <Github className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Repositories</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Connect and manage your GitHub repositories
            </p>
          </button>

          <button 
            onClick={() => router.push("/showcase")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700 hover:shadow-md transition-shadow text-left text-white"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">View Sample Docs</h3>
            </div>
            <p className="text-white/90">
              See the professional quality documentation you&apos;ll get
            </p>
          </button>
        </div>

        {/* Saved Documentation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Documentation ({documentations.length})
            </h2>
            <button 
              onClick={fetchDocumentations}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              Refresh
            </button>
          </div>

          {documentations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No documentation yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by generating documentation for one of your repositories
              </p>
              <button 
                onClick={() => router.push("/repositories")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Your First Documentation
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {documentations.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {doc.repository.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.repository.fullName}
                          </p>
                        </div>
                      </div>
                      
                      {doc.repository.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                          {doc.repository.description}
                        </p>
                      )}
                      
                      {/* Professional Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Files</p>
                              <p className="text-sm font-bold text-blue-800 dark:text-blue-200">{doc.filesAnalyzed}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <div>
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Generated</p>
                              <p className="text-sm font-bold text-green-800 dark:text-green-200">
                                {new Date(doc.generatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {doc.repository.language && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500" />
                              <div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Language</p>
                                <p className="text-sm font-bold text-purple-800 dark:text-purple-200">{doc.repository.language}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <div>
                              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Status</p>
                              <p className="text-sm font-bold text-orange-800 dark:text-orange-200">Ready</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedDoc(doc)
                          setShowModal(true)
                        }}
                        className="p-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                        title="View Professional Documentation"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadMarkdown(doc)}
                        className="p-3 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                        title="Download Documentation"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteDocumentation(doc.id)}
                        className="p-3 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded-lg transition-colors"
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
                          className="px-3 py-1 text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-800 dark:text-blue-200 rounded-full font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                      {doc.repository.topics.length > 5 && (
                        <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
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

        {/* Professional Documentation Modal */}
        {showModal && selectedDoc && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedDoc.repository.name}
                      </h2>
                      <p className="text-white/80 flex items-center gap-4 mt-1">
                        <span>{selectedDoc.repository.fullName}</span>
                        <span>•</span>
                        <span>{selectedDoc.filesAnalyzed} files analyzed</span>
                        <span>•</span>
                        <span>Generated {new Date(selectedDoc.generatedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="documentation-container prose prose-lg max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-2 mb-4 mt-8">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3 mt-6">
                          {children}
                        </h3>
                      ),
                      img: ({ src, alt }) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={alt} className="rounded-lg shadow-lg max-w-full h-auto my-4" />
                      ),
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-600 dark:text-pink-400 font-mono text-sm" {...props}>
                            {children}
                          </code>
                        )
                      },
                      pre: ({ children }) => (
                        <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto my-4 shadow-sm">
                          {children}
                        </pre>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 text-left font-semibold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          {children}
                        </td>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 my-4 rounded-r-lg">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline decoration-2 underline-offset-2 transition-colors"
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
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generated on {new Date(selectedDoc.generatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadMarkdown(selectedDoc)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Download Markdown
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
