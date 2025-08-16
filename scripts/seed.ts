import { db } from '../lib/db';

async function seed() {
  // Intentionally empty seed.
  console.log('No seed data.');
}

seed()
  .then(() => {
    console.log('Seed complete');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
