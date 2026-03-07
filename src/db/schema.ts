import { pgTable, pgEnum, uuid, text, date, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'redacteur', 'subscriber_paid', 'subscriber_free']);
export const newsletterStatusEnum = pgEnum('newsletter_status', ['pending', 'confirmed', 'unsubscribed']);
export const accessLevelEnum = pgEnum('access_level', ['public', 'subscriber_free', 'subscriber_paid']);

// ============================================================================
// PROFILES TABLE (extends auth.users)
// ============================================================================

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().references(() => sql`auth.users(id)`),
    role: userRoleEnum('role').notNull().default('subscriber_free'),
    displayName: text('display_name'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    subscriptionCurrentPeriodEnd: timestamp('subscription_current_period_end', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roleIdx: index('idx_profiles_role').on(table.role),
    stripeCustomerIdx: index('idx_profiles_stripe_customer').on(table.stripeCustomerId),
  }),
);

// ============================================================================
// ARTICLES TABLE
// ============================================================================

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    content: text('content'), // Will store HTML/JSON from TipTap
    date: date('date').notNull(),
    category: text('category').notNull(), // 'lettre', 'pamphlet', 'fosse'
    image: text('image'),
    slug: text('slug').notNull().unique(),
    author: text('author'),
    linkedinUrl: text('linkedinUrl'),
    featured: boolean('featured').default(false),
    published: boolean('published').default(true),
    accessLevel: text('access_level').notNull().default('public'),
    authorId: uuid('author_id').references(() => profiles.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: index('idx_articles_date').on(table.date),
    slugIdx: index('idx_articles_slug').on(table.slug),
    categoryIdx: index('idx_articles_category').on(table.category),
    accessLevelIdx: index('idx_articles_access_level').on(table.accessLevel),
    authorIdIdx: index('idx_articles_author_id').on(table.authorId),
  }),
);

// ============================================================================
// NEWSLETTER SUBSCRIPTIONS TABLE
// ============================================================================

export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    status: newsletterStatusEnum('status').notNull().default('pending'),
    confirmationToken: text('confirmation_token').unique(),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    source: text('source').default('website'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_newsletter_email').on(table.email),
    statusIdx: index('idx_newsletter_status').on(table.status),
    tokenIdx: index('idx_newsletter_token').on(table.confirmationToken),
  }),
);

// ============================================================================
// TYPES
// ============================================================================

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type NewNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;
