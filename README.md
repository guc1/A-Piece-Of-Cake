# A Piece of Cake

## Development

1. Install dependencies
   ```sh
   pnpm install
   ```
2. Create a `.env` file and set required values:
   - `NEXTAUTH_SECRET` – secret used by NextAuth
   - `DATABASE_URL` – PostgreSQL connection string
3. Apply database migrations
   ```sh
   pnpm drizzle-kit push
   ```
4. Start the dev server on port 3001
   ```sh
   pnpm dev
   ```
5. Lint and type-check
   ```sh
   pnpm lint
   pnpm tsc
   ```
6. Run Playwright tests
   ```sh
   pnpm test
   ```
