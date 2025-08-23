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
  jsonb,
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
  // Use text for icons to allow storage of data URLs or longer icon identifiers
  icon: text('icon'),
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
  // Allow longer icon values for custom uploads
  icon: text('icon'),
  importance: integer('importance'),
  targetMix: integer('target_mix'),
  visibility: varchar('visibility', { length: 20 }),
  orderIndex: integer('order_index'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const ingredients = pgTable(
  'ingredients',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    title: varchar('title', { length: 80 }).notNull(),
    shortDescription: varchar('short_description', { length: 160 }),
    description: text('description'),
    whyUsed: text('why_used'),
    whenUsed: text('when_used'),
    tips: text('tips'),
    usefulness: integer('usefulness').default(0),
    imageUrl: text('image_url'),
    // Icon for the ingredient, stored as emoji or data URL
    icon: text('icon'),
    tags: text('tags').array(),
    visibility: varchar('visibility', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    uniqueUserTitle: uniqueIndex('ingredients_user_title_unique').on(
      table.userId,
      table.title,
    ),
  }),
);

export const ingredientRevisions = pgTable('ingredient_revisions', {
  id: serial('id').primaryKey(),
  ingredientId: integer('ingredient_id')
    .references(() => ingredients.id)
    .notNull(),
  snapshotAt: timestamp('snapshot_at').defaultNow(),
  payload: jsonb('payload').notNull(),
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

// Store uploaded or imported icons for each user so others can browse them.
export const userIcons = pgTable('user_icons', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  icon: text('icon').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const plans = pgTable(
  'plans',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    date: date('date').notNull(),
    dailyAim: text('daily_aim'),
    dailyIngredientIds: integer('daily_ingredient_ids').array(),
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
  planId: integer('plan_id')
    .references(() => plans.id)
    .notNull(),
  start: timestamp('start').notNull(),
  end: timestamp('end').notNull(),
  title: varchar('title', { length: 60 }),
  description: text('description'),
  color: varchar('color', { length: 10 }),
  colorPreset: varchar('color_preset', { length: 60 }),
  ingredientIds: integer('ingredient_ids').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const planRevisions = pgTable('plan_revisions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  planDate: date('plan_date').notNull(),
  payload: jsonb('payload').notNull(),
  snapshotAt: timestamp('snapshot_at').defaultNow(),
});

export const profileSnapshots = pgTable(
  'profile_snapshots',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    uniqueUserDate: uniqueIndex('profile_snapshots_user_date_unique').on(
      table.userId,
      table.snapshotDate,
    ),
  }),
);
