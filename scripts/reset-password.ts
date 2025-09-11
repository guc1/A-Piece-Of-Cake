import { resetUserPassword } from '../lib/users';
import { db } from '../lib/db';

async function main() {
  const [idArg, newPassword] = process.argv.slice(2);
  if (!idArg || !newPassword) {
    console.error(
      'Usage: pnpm tsx scripts/reset-password.ts <userId> <newPassword>',
    );
    process.exit(1);
  }
  const userId = Number(idArg);
  if (!Number.isInteger(userId)) {
    console.error('userId must be a number');
    process.exit(1);
  }
  await resetUserPassword(userId, newPassword);
  console.log(`Password updated for user ${userId}`);
  await (db as any).$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
