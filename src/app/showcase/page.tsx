"use client"

import { useState } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { BookOpen, Eye, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Import professional documentation CSS
import '../../styles/documentation-theme.css'
import 'highlight.js/styles/github.css'

// Sample professional documentation to showcase the quality
const sampleDocumentation = `<div align="center">

# 📚 React Todo App
### Professional Documentation

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/example/react-todo)
[![Documentation](https://img.shields.io/badge/Docs-AI%20Generated-green?style=for-the-badge&logo=book)]()
[![Analysis](https://img.shields.io/badge/Files%20Analyzed-15-orange?style=for-the-badge&logo=code)]()

*Generated with ❤️ by [DocuGenius AI](https://docugenius.dev) • January 1, 2025*

</div>

---

<div align="center">

**📋 Quick Navigation**

[🚀 Overview](#-overview) • [⚡ Quick Start](#-quick-start) • [🏗️ Architecture](#-architecture) • [📖 API Reference](#-api-reference) • [💡 Examples](#-usage-examples) • [📁 Project Structure](#-project-structure)

</div>

---

## 🚀 Overview

<div align="center">

### 🎯 What This Project Does

</div>

**React Todo App** is a modern, feature-rich task management application built with React and TypeScript. This project demonstrates best practices in React development, state management, and user interface design.

### ✨ Project Highlights

#### 🌟 Key Features

- ✅ Create, edit, and delete tasks with real-time updates
- ✅ Drag and drop functionality for task reordering
- ✅ Category-based task organization
- ✅ Local storage persistence
- ✅ Responsive design for all devices
- ✅ Dark/light theme support
- ✅ Search and filter capabilities
- ✅ TypeScript for type safety

#### 🛠️ Technologies

- 🔧 React 18 with Hooks for modern component architecture
- 🔧 TypeScript for enhanced developer experience and type safety
- 🔧 Tailwind CSS for utility-first styling
- 🔧 React DnD for drag and drop functionality
- 🔧 LocalStorage API for data persistence
- 🔧 Vite for fast development and optimized builds

#### 🎯 Perfect For

- 📈 Learning modern React development patterns
- 📈 Understanding state management best practices
- 📈 Exploring TypeScript in React applications
- 📈 Building portfolio projects with real-world features

#### 💎 Why Choose This Project

- 🚀 Clean, maintainable codebase following React best practices
- 🚀 Comprehensive TypeScript implementation with proper typing
- 🚀 Mobile-first responsive design approach
- 🚀 Excellent performance with optimized rendering
- 🚀 Extensive documentation and code examples

<details>
<summary>📊 <strong>Project Metrics & Assessment</strong></summary>

| Metric | Assessment | Details |
|--------|------------|----------|
| 📁 Files Analyzed | 15 | Complete codebase coverage |
| 🧠 Complexity | Medium | Well-structured with moderate complexity |
| 🔧 Maintainability | Excellent | Clean code with proper separation of concerns |
| 🧪 Testing | Good | Unit tests for key components |
| ⚡ Performance | Excellent | Optimized rendering and state management |
| 📅 Generated | January 1, 2025 | Documentation freshness |
| 🤖 AI Engine | OpenAI GPT-4 | Advanced code analysis |

</details>

## ⚡ Quick Start

<div align="left">

### 🏃‍♂️ Get Running in 5 Minutes

</div>

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/example/react-todo.git
   cd react-todo
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Start development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to \`http://localhost:3000\` to see the app running!

> 💡 **Pro Tip**: Bookmark this documentation and share it with your team for easy reference!

## 🏗️ Architecture

<div align="center">

### 🧠 System Design & Architecture

</div>

The React Todo App follows a **component-based architecture** with clear separation of concerns:

### Core Architecture Principles

- **Component Composition**: Small, reusable components that compose into larger features
- **State Management**: Uses React hooks (useState, useReducer) for local state management
- **Custom Hooks**: Reusable logic extracted into custom hooks for better code organization
- **TypeScript Integration**: Comprehensive typing for props, state, and function parameters
- **Performance Optimization**: Memoization and optimized re-rendering strategies

### Data Flow

1. **User Interaction** → Component Event Handlers
2. **State Updates** → React State Management (useState/useReducer)
3. **Side Effects** → useEffect hooks for localStorage sync
4. **UI Updates** → React re-rendering with optimized performance

<details>
<summary>🔍 <strong>Architecture Deep Dive</strong></summary>

This section provides detailed insights into the architectural decisions and design patterns used in this project. The architecture has been carefully analyzed to ensure scalability, maintainability, and performance.

</details>

## 📁 Project Structure

### 🌳 Codebase Organization

\`\`\`
src/
├── components/           # Reusable UI components
│   ├── TodoItem.tsx     # Individual todo item component
│   ├── TodoList.tsx     # List container component
│   ├── AddTodo.tsx      # Form for adding new todos
│   └── ThemeToggle.tsx  # Dark/light mode toggle
├── hooks/               # Custom React hooks
│   ├── useTodos.ts      # Todo management logic
│   ├── useLocalStorage.ts # Local storage persistence
│   └── useTheme.ts      # Theme management
├── types/               # TypeScript type definitions
│   └── todo.types.ts    # Todo-related types
├── utils/               # Utility functions
│   └── helpers.ts       # Common helper functions
├── styles/              # Global styles and themes
│   └── globals.css      # Tailwind CSS imports
└── App.tsx              # Main application component
\`\`\`

<details>
<summary>📋 <strong>File Structure Guide</strong></summary>

Understanding the project structure is crucial for contributing and maintaining the codebase. Each directory has been organized with specific purposes and follows industry best practices.

</details>

## 💡 Usage Examples

### 🎨 Real-World Implementation Examples

### Basic Todo Operations

\`\`\`typescript
// Adding a new todo
const handleAddTodo = (text: string) => {
  const newTodo: Todo = {
    id: Date.now().toString(),
    text,
    completed: false,
    category: 'general',
    createdAt: new Date().toISOString()
  }
  setTodos(prev => [...prev, newTodo])
}

// Toggling todo completion
const handleToggleTodo = (id: string) => {
  setTodos(prev => 
    prev.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    )
  )
}
\`\`\`

### Custom Hook Implementation

\`\`\`typescript
// useTodos hook for state management
export const useTodos = () => {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', [])
  
  const addTodo = useCallback((text: string) => {
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    }
    setTodos(prev => [...prev, newTodo])
  }, [setTodos])
  
  return { todos, addTodo, toggleTodo, deleteTodo }
}
\`\`\`

<div align="center">

**🌟 Want to see more examples?** Check out our [example repository](https://github.com/example/react-todo/tree/examples) for additional use cases!

</div>

---

<div align="center">

## 🤝 Contributing & Support

### 🌟 Help Make This Project Even Better

[![GitHub Issues](https://img.shields.io/badge/Issues-Report%20Bug-red?style=flat-square&logo=github)](https://github.com/example/react-todo/issues)
[![GitHub PRs](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square&logo=github)](https://github.com/example/react-todo/pulls)
[![GitHub Discussions](https://img.shields.io/badge/Discussions-Join%20Community-blue?style=flat-square&logo=github)](https://github.com/example/react-todo/discussions)

### 📞 Need Help?

- 📖 **Documentation**: You're looking at it! This comprehensive guide covers everything.
- 🐛 **Found a Bug?**: [Open an issue](https://github.com/example/react-todo/issues) with detailed reproduction steps.
- 💡 **Feature Request?**: [Start a discussion](https://github.com/example/react-todo/discussions) to share your ideas.
- 💬 **Questions?**: Check existing [discussions](https://github.com/example/react-todo/discussions) or create a new one.

### 🎯 What Makes This Documentation Special

✨ **AI-Powered Analysis**: Generated using advanced AI to ensure comprehensive coverage

🔍 **Deep Code Understanding**: Every file, function, and component analyzed in detail

📚 **Professional Quality**: Documentation that matches industry standards

⚡ **Instantly Useful**: Copy-paste examples and clear explanations

🚀 **Always Up-to-Date**: Regenerate anytime as your code evolves

---

### 🏆 Powered By DocuGenius

This professional documentation was generated by **[DocuGenius AI](https://docugenius.dev)** - the intelligent documentation platform that transforms your code into beautiful, comprehensive docs.

**Why developers love DocuGenius:**
- 🎯 **Saves Hours**: No more manual documentation writing
- 🧠 **AI-Powered**: Advanced code understanding and analysis
- 📈 **Professional Results**: Documentation that impresses users and contributors
- ⚡ **Lightning Fast**: Generate comprehensive docs in minutes

[![Try DocuGenius](https://img.shields.io/badge/Try%20DocuGenius-Generate%20Your%20Docs-brightgreen?style=for-the-badge&logo=robot)](https://docugenius.dev)

---

<sub>📅 Last Updated: January 1, 2025 | 🤖 Generated by DocuGenius AI | ⭐ [Star this repository](https://github.com/example/react-todo) if this documentation helped you!</sub>

</div>`

export default function DocumentationShowcase() {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-800 dark:text-white">DocuGenius</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!showPreview ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                See What Professional Documentation Looks Like
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Experience the quality and depth of documentation that DocuGenius AI generates for your repositories.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Visual Appeal</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Beautiful formatting with badges, gradients, and professional styling that makes your documentation stand out.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Comprehensive</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Every aspect of your code analyzed and documented, from architecture to individual functions.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Use</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Copy-paste code examples, clear explanations, and actionable guidance that developers love.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => setShowPreview(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                View Sample Documentation
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                See exactly what your users will experience
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Sample Professional Documentation</h2>
                      <p className="text-white/80">Experience the quality your users will see</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                    title="Go back to overview"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <div className="documentation-container prose prose-lg max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
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
                    {sampleDocumentation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
