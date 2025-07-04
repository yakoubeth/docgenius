import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export interface SavedDocumentation {
  id: string
  title: string
  markdownContent: string
  structuredData: Record<string, unknown>
  filesAnalyzed: number
  generatedAt: Date
  repository: {
    id: number
    name: string
    fullName: string
    description: string | null
    language: string | null
    topics: string[]
  }
}

export class DocumentationService {
  static async saveDocumentation(
    userId: string,
    repositoryData: {
      id: number
      name: string
      fullName: string
      description?: string | null
      language?: string | null
      topics?: string[]
      private?: boolean
      htmlUrl: string
    },
    documentation: {
      title: string
      markdownContent: string
      structuredData: Record<string, unknown>
      filesAnalyzed: number
    }
  ): Promise<SavedDocumentation> {
    // First, ensure the user exists in the database
    const user = await prisma.user.upsert({
      where: { githubId: userId },
      update: {
        updatedAt: new Date(),
      },
      create: {
        githubId: userId,
        username: `user_${userId}`, // We'll use a placeholder username
        accessToken: 'placeholder', // Required field, we'll use a placeholder
        // Other fields will be null/empty for now since we don't have user profile data
      },
    })

    // Upsert repository
    await prisma.repository.upsert({
      where: { id: repositoryData.id },
      update: {
        name: repositoryData.name,
        fullName: repositoryData.fullName,
        description: repositoryData.description,
        language: repositoryData.language,
        topics: repositoryData.topics ? JSON.stringify(repositoryData.topics) : null,
        private: repositoryData.private || false,
        htmlUrl: repositoryData.htmlUrl,
        updatedAt: new Date(),
      },
      create: {
        id: repositoryData.id,
        name: repositoryData.name,
        fullName: repositoryData.fullName,
        description: repositoryData.description,
        language: repositoryData.language,
        topics: repositoryData.topics ? JSON.stringify(repositoryData.topics) : null,
        private: repositoryData.private || false,
        htmlUrl: repositoryData.htmlUrl,
      },
    })

    // Upsert documentation
    const savedDoc = await prisma.documentation.upsert({
      where: {
        userId_repositoryId: {
          userId: user.id, // Use the actual user ID from the database
          repositoryId: repositoryData.id,
        },
      },
      update: {
        title: documentation.title,
        markdownContent: documentation.markdownContent,
        structuredData: JSON.stringify(documentation.structuredData),
        filesAnalyzed: documentation.filesAnalyzed,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id, // Use the actual user ID from the database
        repositoryId: repositoryData.id,
        title: documentation.title,
        markdownContent: documentation.markdownContent,
        structuredData: JSON.stringify(documentation.structuredData),
        filesAnalyzed: documentation.filesAnalyzed,
      },
      include: {
        repository: true,
      },
    })

    return {
      id: savedDoc.id,
      title: savedDoc.title,
      markdownContent: savedDoc.markdownContent,
      structuredData: JSON.parse(savedDoc.structuredData),
      filesAnalyzed: savedDoc.filesAnalyzed,
      generatedAt: savedDoc.generatedAt,
      repository: {
        id: savedDoc.repository.id,
        name: savedDoc.repository.name,
        fullName: savedDoc.repository.fullName,
        description: savedDoc.repository.description,
        language: savedDoc.repository.language,
        topics: savedDoc.repository.topics ? JSON.parse(savedDoc.repository.topics) : [],
      },
    }
  }

  static async getUserDocumentations(githubId: string): Promise<SavedDocumentation[]> {
    // First, find the user by GitHub ID to get their database ID
    const user = await prisma.user.findUnique({
      where: { githubId },
    })

    if (!user) {
      return [] // No user found, return empty array
    }

    const docs = await prisma.documentation.findMany({
      where: { userId: user.id }, // Use the actual database user ID
      include: {
        repository: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return docs.map(doc => ({
      id: doc.id,
      title: doc.title,
      markdownContent: doc.markdownContent,
      structuredData: JSON.parse(doc.structuredData),
      filesAnalyzed: doc.filesAnalyzed,
      generatedAt: doc.generatedAt,
      repository: {
        id: doc.repository.id,
        name: doc.repository.name,
        fullName: doc.repository.fullName,
        description: doc.repository.description,
        language: doc.repository.language,
        topics: doc.repository.topics ? JSON.parse(doc.repository.topics) : [],
      },
    }))
  }

  static async getDocumentationById(id: string, githubId: string): Promise<SavedDocumentation | null> {
    // First, find the user by GitHub ID to get their database ID
    const user = await prisma.user.findUnique({
      where: { githubId },
    })

    if (!user) {
      return null // No user found
    }

    const doc = await prisma.documentation.findFirst({
      where: {
        id,
        userId: user.id, // Use the actual database user ID
      },
      include: {
        repository: true,
      },
    })

    if (!doc) return null

    return {
      id: doc.id,
      title: doc.title,
      markdownContent: doc.markdownContent,
      structuredData: JSON.parse(doc.structuredData),
      filesAnalyzed: doc.filesAnalyzed,
      generatedAt: doc.generatedAt,
      repository: {
        id: doc.repository.id,
        name: doc.repository.name,
        fullName: doc.repository.fullName,
        description: doc.repository.description,
        language: doc.repository.language,
        topics: doc.repository.topics ? JSON.parse(doc.repository.topics) : [],
      },
    }
  }

  static async deleteDocumentation(id: string, githubId: string): Promise<boolean> {
    try {
      // First, find the user by GitHub ID to get their database ID
      const user = await prisma.user.findUnique({
        where: { githubId },
      })

      if (!user) {
        return false // No user found
      }

      await prisma.documentation.delete({
        where: {
          id,
          userId: user.id, // Use the actual database user ID
        },
      })
      return true
    } catch {
      return false
    }
  }

  static async saveUser(userData: {
    githubId: string
    username: string
    email?: string | null
    name?: string | null
    avatarUrl?: string | null
    accessToken: string
  }): Promise<void> {
    await prisma.user.upsert({
      where: { githubId: userData.githubId },
      update: {
        username: userData.username,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        accessToken: userData.accessToken,
        updatedAt: new Date(),
      },
      create: {
        githubId: userData.githubId,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        accessToken: userData.accessToken,
      },
    })
  }
}

export default DocumentationService
