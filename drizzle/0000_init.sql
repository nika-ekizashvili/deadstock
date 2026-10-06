CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('available', 'reserved', 'sold', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."review_state" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."shop_status" AS ENUM('pending', 'active', 'paused');--> statement-breakpoint
CREATE TABLE "instagram_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"ig_user_id" text NOT NULL,
	"username" text NOT NULL,
	"access_token_enc" text NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"auto_publish" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_full_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_accounts_shop_id_unique" UNIQUE("shop_id"),
	CONSTRAINT "instagram_accounts_ig_user_id_unique" UNIQUE("ig_user_id")
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"ig_media_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"ig_media_id" text NOT NULL,
	"permalink" text NOT NULL,
	"caption" text,
	"caption_hash" text,
	"title" text,
	"price_gel" numeric(10, 2),
	"size" text,
	"brand" text,
	"category" text,
	"condition" text,
	"status" "listing_status" DEFAULT 'available' NOT NULL,
	"review" "review_state" DEFAULT 'pending' NOT NULL,
	"manual_override" boolean DEFAULT false NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"posted_at" timestamp with time zone NOT NULL,
	"sold_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"city" text DEFAULT 'tbilisi' NOT NULL,
	"address" text,
	"avatar_key" text,
	"status" "shop_status" DEFAULT 'pending' NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"full" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"created" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"marked_sold" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "instagram_accounts" ADD CONSTRAINT "instagram_accounts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_account_id_instagram_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."instagram_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "listing_images_pos_uq" ON "listing_images" USING btree ("listing_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_ig_media_uq" ON "listings" USING btree ("ig_media_id");--> statement-breakpoint
CREATE INDEX "listings_feed_idx" ON "listings" USING btree ("status","review","posted_at");--> statement-breakpoint
CREATE INDEX "listings_shop_idx" ON "listings" USING btree ("shop_id","posted_at");--> statement-breakpoint
CREATE INDEX "listings_search_trgm_idx" ON "listings" USING gin ("search_text" gin_trgm_ops);