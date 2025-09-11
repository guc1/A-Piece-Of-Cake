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
   pnpm drizzle-kit migrate
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

## Favicon

1. Place your favicon image at `public/Favicon_pieceofcake.png`.
2. The app automatically references this file, so ensure the filename matches when deploying.

## Manual password reset

Use the provided script to set a new password for a user when you know their
database ID.

```
pnpm tsx scripts/reset-password.ts <userId> <newPassword>
```

The script hashes the supplied password and updates the user record in the
database.
