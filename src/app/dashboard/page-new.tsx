"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { BookOpen, Github, Plus, FileText, LogOut, Download, Eye, Trash2, Clock } from "lucide-react"

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
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
            <div className="grid gap-4">
              {documentations.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {doc.repository.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {doc.repository.fullName}
                      </p>
                      {doc.repository.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {doc.repository.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{doc.filesAnalyzed} files analyzed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Generated {new Date(doc.generatedAt).toLocaleDateString()}</span>
                        </div>
                        {doc.repository.language && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>{doc.repository.language}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedDoc(doc)
                          setShowModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="View Documentation"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadMarkdown(doc)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Download Markdown"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteDocumentation(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete Documentation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {doc.repository.topics.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {doc.repository.topics.slice(0, 5).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                      {doc.repository.topics.length > 5 && (
                        <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
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

        {/* Documentation Modal */}
        {showModal && selectedDoc && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedDoc.repository.name} Documentation
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {selectedDoc.repository.fullName} • {selectedDoc.filesAnalyzed} files analyzed
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: selectedDoc.markdownContent
                        .replace(/```(\w+)?\n([\s\S]*?)\n```/g, '<pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto"><code>$2</code></pre>')
                        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded text-sm">$1</code>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mt-6 mb-3">$1</h2>')
                        .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mt-4 mb-2">$1</h3>')
                        .replace(/^#### (.*$)/gm, '<h4 class="text-lg font-medium mt-3 mb-2">$1</h4>')
                        .replace(/^##### (.*$)/gm, '<h5 class="text-base font-medium mt-2 mb-1">$1</h5>')
                        .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
                        .replace(/\n\n/g, '</p><p class="mb-4">')
                        .replace(/^(?!<[h1-6]|<li|<pre|<\/p>)/gm, '<p class="mb-4">')
                    }}
                  />
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
