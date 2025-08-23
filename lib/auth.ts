import { getServerSession, type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { jwtDecrypt } from 'jose';
import hkdf from '@panva/hkdf';
import { getUserByEmail, verifyPassword } from '@/lib/users';

// NextAuth configuration used both by the route handler and server helpers
const SESSION_MAX_AGE = 10 * 365 * 24 * 60 * 60; // 10 years in seconds

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
        const user = await getUserByEmail(credentials.email);
        if (!user) return null;
        const ok = verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id.toString(),
          name: user.name ?? undefined,
          email: user.email,
        };
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
  jwt: {
    maxAge: SESSION_MAX_AGE,
    async decode({ token, secret, salt = '' }) {
      if (!token || !secret) return null;
      const encryptionSecret = await hkdf(
        'sha256',
        secret,
        salt,
        `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ''}`,
        32,
      );
      const { payload } = await jwtDecrypt(token, encryptionSecret, {
        // Permit large clock skew so overridden site times don't expire sessions.
        clockTolerance: SESSION_MAX_AGE,
      });
      return payload as any;
    },
  },
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/signin',
  },
};

// Helper to retrieve the current session on the server
export function auth() {
  return getServerSession(authOptions);
}
