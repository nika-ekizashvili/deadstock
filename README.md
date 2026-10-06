# DEADSTOCK

Tbilisi's Instagram thrift shops in one searchable place. Shops connect Instagram once; every post becomes a listing, and it disappears when the caption says SOLD or the post is deleted. Each shop gets `[shop].deadstock.ge`.

MVP setup only — pages are unstyled placeholders until the design lands.

## Stack

- **Next.js 16** (App Router) — web, shop subdomains (`src/proxy.ts`), dashboard
- **PostgreSQL + Drizzle** — schema in `src/db/schema.ts`, migrations in `drizzle/`
- **pg-boss** — job queue on the same Postgres; worker in `src/worker/`
- **S3 / MinIO** — Instagram images are mirrored (IG CDN links expire)

## Run locally

```bash
cp .env.example .env            # then fill SESSION_SECRET and TOKEN_ENCRYPTION_KEY (openssl rand -hex 32)
docker compose up -d postgres minio minio-init
pnpm install
pnpm db:migrate
pnpm db:seed                    # optional demo shop with 5 listings
pnpm dev                        # http://localhost:3000
pnpm worker                     # separate terminal: Instagram sync
```

Shop pages locally: http://demo-shop.localhost:3000 (or `/s/demo-shop`).

## How it works

```
Shop → /api/instagram/connect → Instagram login → /api/instagram/callback
     → shop + encrypted token saved → full sync queued → /dashboard

Worker (pg-boss):
  every 15 min   sync-all       → incremental sync (latest ~100 posts) per shop
  03:30 Tbilisi  sync-all-full  → full sync; posts no longer on Instagram → sold
```

Per post (`src/worker/sync.ts`):

- **New post** → caption parsed (`src/lib/parse/caption.ts`) → listing + mirrored images. Goes to the shop's review queue unless *auto-publish* is on.
- **Caption edited** → re-parsed; `SOLD` / `გაიყიდა` → sold, `RESERVED` → reserved.
- **Shop changed status in dashboard** → `manual_override`, sync won't touch it.

Search uses a `search_text` column with Georgian→Latin transliteration ("kaba" finds "კაბა"), indexed with `pg_trgm`.

## Instagram setup

1. Create a Meta app → add **Instagram API with Instagram Login**.
2. Redirect URI: `{APP_URL}/api/instagram/callback`. Scope: `instagram_business_basic`.
3. Add test users (the pilot shop) while in development mode; submit for **app review** to open it to all shops.
4. Shops need an Instagram **Business or Creator** account.

## Scripts

| Command | What |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm worker` | Sync worker |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle |
| `pnpm test` | Unit tests (caption parser, transliteration) |
| `pnpm test:int` | Sync integration test (needs Postgres) |
| `pnpm typecheck` / `pnpm lint` | Checks |

## Deploy

`docker compose --profile app up -d --build` runs web + worker from one image. In production point `S3_*` at real object storage, set `ROOT_DOMAIN=deadstock.ge`, and add a wildcard DNS record + wildcard TLS certificate for `*.deadstock.ge`. Secrets (`SESSION_SECRET`, `TOKEN_ENCRYPTION_KEY`, `IG_APP_SECRET`) belong in Vault.

## Next up

- [ ] LLM caption parsing (carousels with several items, better titles/brands)
- [ ] Shop settings: address, hours, delivery info
- [ ] Rate-limit handling + backoff for Instagram API
- [ ] Design implementation
