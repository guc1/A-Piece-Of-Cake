# Update Log

- 2025-08-16: Initial bootstrap with Next.js, Tailwind, shadcn/ui components, guest authentication, Drizzle setup, and Playwright smoke test scaffold.

- 2025-08-16: Refactored authentication to use `getServerSession` for NextAuth v4, fixing runtime `auth` function error.
- 2025-08-16: Redirect unauthenticated users to `/signin` and document `NEXTAUTH_URL` env.

## Follow-ups
- [ ] Add OAuth (Google) + DB adapter for NextAuth
- [ ] Implement onboarding for Signature Ethos + Credo
- [ ] Wire flavors UI to DB
- [ ] Add visibility model and guards
- [ ] Add AI coach stub endpoint/action
