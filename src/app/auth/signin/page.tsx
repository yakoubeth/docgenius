"use client"

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Github, BookOpen } from "lucide-react"
import type { ClientSafeProvider } from "next-auth/react"

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-8">
            <BookOpen className="h-12 w-12 text-blue-600" />
            <span className="text-3xl font-bold text-gray-800 dark:text-white">DocuGenius</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Connect your GitHub account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to start generating documentation for your repositories
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <button
                  onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
                  className="w-full flex justify-center items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  <Github className="h-6 w-6 mr-3" />
                  Sign in with {provider.name}
                </button>
              </div>
            ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
