ALTER TABLE "instagram_accounts" ALTER COLUMN "auto_publish" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "is_video" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "lng" double precision;