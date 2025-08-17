# A Piece of Cake

## Development

1. Install dependencies
   ```sh
   pnpm install
   ```
2. Create a `.env` file and set required values:
   - `NEXTAUTH_SECRET` – secret used by NextAuth
   - `DATABASE_URL` – PostgreSQL connection string (optional, memory store used by default)
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

## Usage

- Visit `http://localhost:3001/` and choose **Sign up** to create a new account.
- After creating an account you will be signed in automatically and taken to your flavors page.
- Signed-in users will retain their flavors as long as the server is running.
