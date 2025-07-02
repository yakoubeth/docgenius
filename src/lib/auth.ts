import GitHubProvider from "next-auth/providers/github"

interface GitHubProfile {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
}

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    })
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account, profile }: any) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.githubId = (profile as GitHubProfile)?.id?.toString()
        // Use githubId as the user ID since we don't have a database
        token.sub = token.githubId
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      // Send properties to the client
      if (session.user) {
        session.accessToken = token.accessToken as string
        session.user.githubId = token.githubId as string
        session.user.id = token.githubId as string // Set user.id to githubId
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/",
  },
  session: {
    strategy: "jwt" as const,
  },
}
