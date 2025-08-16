import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// Authentication configuration shared between NextAuth route handlers and server utilities.
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
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/signin',
  },
};

/**
 * Helper to retrieve the current session on the server.
 * Using NextAuth v4 we need to wrap getServerSession with our config.
 */
export function auth() {
  return getServerSession(authOptions);
}
