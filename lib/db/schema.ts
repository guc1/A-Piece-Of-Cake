import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  handle: text('handle').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  accountVisibility: varchar('account_visibility', { length: 10 })
    .notNull()
    .default('open'),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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

export const subflavors = pgTable('subflavors', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  flavorId: text('flavor_id').references(() => flavors.id),
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

export const follows = pgTable(
  'follows',
  {
    id: serial('id').primaryKey(),
    followerId: integer('follower_id').references(() => users.id).notNull(),
    followingId: integer('following_id').references(() => users.id).notNull(),
    status: varchar('status', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    uniq: uniqueIndex('follows_unique')
      .on(table.followerId, table.followingId),
  })
);

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  toUserId: integer('to_user_id').references(() => users.id).notNull(),
  fromUserId: integer('from_user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at'),
});
