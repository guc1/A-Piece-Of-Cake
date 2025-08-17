import {
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const visibilityEnum = pgEnum('visibility', [
  'private',
  'friends',
  'followers',
  'public',
]);

export const flavors = pgTable('flavors', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  slug: varchar('slug', { length: 64 }).notNull(),
  name: varchar('name', { length: 40 }).notNull(),
  description: varchar('description', { length: 280 }),
  color: varchar('color', { length: 7 }).notNull(),
  icon: varchar('icon', { length: 64 }).notNull(),
  importance: integer('importance').notNull(),
  targetMix: integer('target_mix').notNull(),
  visibility: visibilityEnum('visibility').default('public').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
