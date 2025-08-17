import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// NextAuth configuration used both by the route handler and server helpers
export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Guest',
      credentials: {
        password: { label: 'Guest password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials?.password === process.env.GUEST_PASSWORD) {
          return { id: Math.random().toString(36).slice(2) };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    // Persist the user's id in the JWT so it can be read from the session
    async jwt({ token, user }) {
      if (user) {
        // On initial sign in, the user object is available and we store the id
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Expose the user id on the session for server actions/routes
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/signin',
  },
};

// Helper to retrieve the current session on the server
export function auth() {
  return getServerSession(authOptions);
}
