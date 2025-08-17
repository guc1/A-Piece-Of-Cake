import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const flavors = pgTable('flavors', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  slug: text('slug').notNull(),
  name: varchar('name', { length: 40 }),
  description: text('description'),
  color: varchar('color', { length: 10 }),
  icon: varchar('icon', { length: 10 }),
  importance: integer('importance'),
  targetMix: integer('target_mix'),
  visibility: varchar('visibility', { length: 20 }),
  orderIndex: integer('order_index'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
