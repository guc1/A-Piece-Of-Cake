import { pgTable, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const flavors = pgTable('flavors', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  name: varchar('name', { length: 256 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
