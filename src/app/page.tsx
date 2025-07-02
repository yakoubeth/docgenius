"use client"

import { BookOpen, Github, Sparkles, FileText, Zap } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-gray-800 dark:text-white">DocuGenius</span>
            </div>
            <div className="flex items-center space-x-3">
              {session ? (
                <>
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {session.user?.image && (
                        <Image 
                          src={session.user.image} 
                          alt={session.user.name || 'User avatar'} 
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300 max-w-24 truncate">
                        {session.user?.name}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden">App</span>
                  </button>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm px-2"
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">Out</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => router.push("/auth/signin")}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 pt-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Documentation Generator</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Say goodbye to 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> tedious</span>
            <br />documentation
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            DocuGenius automatically generates clear, comprehensive, and maintainable documentation 
            for your codebases using the power of Artificial Intelligence.
          </p>

          <div className="flex justify-center mb-16">
            <button 
              onClick={handleGetStarted}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-lg font-medium justify-center"
            >
              <Github className="h-5 w-5" />
              <span>{session ? "Go to Dashboard" : "Connect GitHub Repository"}</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Github className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">GitHub Integration</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Securely connect your GitHub account and select repositories for documentation generation.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI-Powered Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced AI analyzes your code structure, functions, classes, and generates human-readable explanations.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Markdown Output</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Generate clean, well-formatted Markdown documentation that integrates seamlessly with your workflow.
            </p>
          </div>
        </div>

        {/* Problem & Solution Section */}
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">The Problem</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Increased onboarding time for new developers</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Difficulty maintaining and scaling complex projects</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Knowledge silos within development teams</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Inconsistent documentation quality</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">The Solution</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              DocuGenius leverages cutting-edge AI to analyze your code and generate high-quality documentation automatically. 
              Make documentation a seamless part of your development lifecycle, not a chore.
            </p>
            <div className="flex items-center space-x-4">
              <Zap className="h-8 w-8 text-yellow-500" />
              <span className="text-lg font-medium text-gray-900 dark:text-white">Automated • Intelligent • Scalable</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-24">
        <div className="container mx-auto px-6 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 DocuGenius. Making documentation effortless with AI.</p>
        </div>
      </footer>
    </div>
  );
}
