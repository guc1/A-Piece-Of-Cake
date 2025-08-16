import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { auth, handlers, signIn, signOut } = NextAuth({
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
});
