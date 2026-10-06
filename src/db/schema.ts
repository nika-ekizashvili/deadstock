import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const shopStatus = pgEnum("shop_status", ["pending", "active", "paused"]);
export const listingStatus = pgEnum("listing_status", [
  "available",
  "reserved",
  "sold",
  "hidden",
]);
export const reviewState = pgEnum("review_state", ["pending", "approved", "rejected"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** A shop = one Instagram seller. `slug` is the subdomain: [slug].deadstock.ge */
export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio"),
  city: text("city").notNull().default("tbilisi"),
  address: text("address"),
  avatarKey: text("avatar_key"),
  status: shopStatus("status").notNull().default("pending"),
  /** First 10 shops are free during the MVP. */
  isFree: boolean("is_free").notNull().default(true),
  ...timestamps,
});

export const instagramAccounts = pgTable("instagram_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .notNull()
    .unique()
    .references(() => shops.id, { onDelete: "cascade" }),
  igUserId: text("ig_user_id").notNull().unique(),
  username: text("username").notNull(),
  /** AES-256-GCM encrypted long-lived token (see lib/crypto.ts). */
  accessTokenEnc: text("access_token_enc").notNull(),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
  /** When true, imported items skip the review queue. */
  autoPublish: boolean("auto_publish").notNull().default(false),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastFullSyncAt: timestamp("last_full_sync_at", { withTimezone: true }),
  ...timestamps,
});

/** One Instagram post = one listing (carousel splitting comes later). */
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    igMediaId: text("ig_media_id").notNull(),
    permalink: text("permalink").notNull(),
    caption: text("caption"),
    captionHash: text("caption_hash"),

    title: text("title"),
    priceGel: numeric("price_gel", { precision: 10, scale: 2 }),
    size: text("size"),
    brand: text("brand"),
    category: text("category"),
    condition: text("condition"),

    status: listingStatus("status").notNull().default("available"),
    review: reviewState("review").notNull().default("pending"),
    /** Set by the shop in the dashboard; sync never overrides it. */
    manualOverride: boolean("manual_override").notNull().default(false),
    /** Lower-case Georgian + Latin transliteration for search. */
    searchText: text("search_text").notNull().default(""),

    postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("listings_ig_media_uq").on(t.igMediaId),
    index("listings_feed_idx").on(t.status, t.review, t.postedAt),
    index("listings_shop_idx").on(t.shopId, t.postedAt),
    index("listings_search_trgm_idx").using("gin", sql`${t.searchText} gin_trgm_ops`),
  ],
);

export const listingImages = pgTable(
  "listing_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    igMediaId: text("ig_media_id").notNull(),
    storageKey: text("storage_key").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("listing_images_pos_uq").on(t.listingId, t.position)],
);

export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => instagramAccounts.id, { onDelete: "cascade" }),
  full: boolean("full").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  created: integer("created").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  markedSold: integer("marked_sold").notNull().default(0),
  error: text("error"),
});

export const shopsRelations = relations(shops, ({ one, many }) => ({
  instagram: one(instagramAccounts),
  listings: many(listings),
}));
export const instagramRelations = relations(instagramAccounts, ({ one }) => ({
  shop: one(shops, { fields: [instagramAccounts.shopId], references: [shops.id] }),
}));
export const listingsRelations = relations(listings, ({ one, many }) => ({
  shop: one(shops, { fields: [listings.shopId], references: [shops.id] }),
  images: many(listingImages),
}));
export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));
