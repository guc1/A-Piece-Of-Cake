# A Piece of Cake

## Development

1. Install dependencies
   ```sh
   pnpm install
   ```
2. Create a `.env` file and set required values:
   - `GUEST_PASSWORD` – password for guest login
   - `NEXTAUTH_SECRET` – secret used by NextAuth
   - `DATABASE_URL` – PostgreSQL connection string (if using the DB)
3. Start the dev server on port 3001
   ```sh
   pnpm dev
   ```
4. Lint and type-check
   ```sh
   pnpm lint
   pnpm tsc
   ```
5. Run Playwright tests
   ```sh
   pnpm test
   ```
