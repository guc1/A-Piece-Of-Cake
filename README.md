# A Piece of Cake

## Development

1. Install dependencies with [pnpm](https://pnpm.io): `pnpm install`.
2. Copy `.env.example` to `.env` and provide values for required variables like `NEXTAUTH_SECRET`, `GUEST_PASSWORD`, and `NEXTAUTH_URL` (e.g., `http://localhost:3001`).
3. Start the development server: `pnpm dev` (runs on [http://localhost:3001](http://localhost:3001)).
4. Lint the codebase: `pnpm lint`.
5. Type-check without emitting files: `pnpm tsc --noEmit`.
6. Run Playwright tests: `pnpm test`.
