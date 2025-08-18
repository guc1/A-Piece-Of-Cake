import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  date,
  integer,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const accountVisibilityEnum = pgEnum('account_visibility', [
  'open',
  'closed',
  'private',
]);

export const followStatusEnum = pgEnum('follow_status', [
  'pending',
  'accepted',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'follow_request',
  'follow_accepted',
  'follow_declined',
  'unfollow',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  handle: varchar('handle', { length: 50 }).notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  viewId: text('view_id').notNull().unique(),
  accountVisibility: accountVisibilityEnum('account_visibility')
    .notNull()
    .default('open'),
  email: text('email').notNull().unique(),
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
    followerId: integer('follower_id')
      .references(() => users.id)
      .notNull(),
    followingId: integer('following_id')
      .references(() => users.id)
      .notNull(),
    status: followStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    uniqueFollowerFollowing: uniqueIndex(
      'follows_follower_following_unique',
    ).on(table.followerId, table.followingId),
  }),
);

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  toUserId: integer('to_user_id')
    .references(() => users.id)
    .notNull(),
  fromUserId: integer('from_user_id')
    .references(() => users.id)
    .notNull(),
  type: notificationTypeEnum('type').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at'),
});

export const plans = pgTable(
  'plans',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    date: date('date').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    uniqueUserDate: uniqueIndex('plans_user_date_unique').on(
      table.userId,
      table.date,
    ),
  }),
);

export const planBlocks = pgTable('plan_blocks', {
  id: text('id').primaryKey(),
  planId: integer('plan_id').references(() => plans.id).notNull(),
  start: timestamp('start').notNull(),
  end: timestamp('end').notNull(),
  title: varchar('title', { length: 60 }),
  description: text('description'),
  color: varchar('color', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
