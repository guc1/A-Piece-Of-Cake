import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyUser } from '@/lib/user-store';

// NextAuth configuration used both by the route handler and server helpers
export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = verifyUser(credentials.email.toLowerCase(), credentials.password);
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email } as any;
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
