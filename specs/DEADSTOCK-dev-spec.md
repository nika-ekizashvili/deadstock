# DEADSTOCK — Dev spec

Oct 7, 2026 · @Nika

## Overview

DEADSTOCK (deadstock.ge) pulls Instagram second-hand shops into one feed; shoppers find, save and DM, and the sale happens on Instagram. Shops register free; BOOST is the only paid feature. Every screen is on the [design canvas](https://claude.ai/artifact/1fS1tPty1d9aWA6zM6Ffro).

- **v1 scope:** Tbilisi only, all second-hand categories, the first 10 pilot shops.
- **Not in v1:** buyer–shop payments, delivery, in-app chat.
- **Each shop** gets its own subdomain: `[shop].deadstock.ge`.
- **UI language:** Georgian, with an ENG switch. Status words such as SOLD, HOLD, DROP and BOOST stay in Latin.
- **Copy rule:** as few words as possible. Use an icon or 1–2 words, never a helper sentence. Every icon-only control has an `aria-label` and a `title`.
- **Audience:** Gen Z. The look is "night market": a dark ground, an acid-lime accent and film grain.

## Screen map

There are 108 artboards; the names below match the canvas. *-375* means mobile, *-1440* means desktop, `*` means both, and *-EN* is the English version. Every shopper screen has an -EN version; the shop dashboard is Georgian only. Every route is a suggestion.

| Area | Artboards | Route | Purpose |
| --- | --- | --- | --- |
| Home | Home-\*, Home-\*-EN, Home-\*-Empty, Home-375-Early | `/` | Feed, ticker, category chips, filters |
| Search | Search-\*, Search-\*-EN | `/search?q=` | Results, filter chips, save-search alert |
| Item | Item-\* (+ Sold), Item-375 (+ NoPrice, Sticky), Item-\*-EN | `/[shop]/[item]` | Photos, price tag, DM, save, report |
| Shop | Shop-\*, Shop-375-Empty, Shop-\*-EN | `[shop].deadstock.ge` | Follow, drop countdown, available + SOLD |
| Shopper | Saved-\*, Alerts-\*, Drops-\*, Map-\*, Me-\*, Swipe-375, each + -EN | `/saved` `/alerts` `/drops` `/map` `/me` | Personal lists, alerts, profile |
| Auth & trust | Auth-\*, Report-\*, Notif-\*; Auth and Notif + -EN | modal / `/settings/notifications` | Shopper log-in, report, notification prefs |
| Shop sign-in + onboarding | SignIn-\*, Onb-Import, Onb-Review, Onb-Shop, Onb-Live | `/sell` → `/sell/1..4` | IG connect, pick posts, fix price/size, profile, live |
| Shop dashboard | Dash-\*, Dash-Edit-\*, Dash-Hold-\*, Dash-Drop-\*, Dash-Sync-\*, Dash-Settings-\*, Dash-Stats-1440 | `/dash/...` | Review queue, items, hold, drops, sync, settings, stats |
| BOOST (paid) | Dash-Boost-\*, Dash-Pay-\*, Dash-Boosts-\* | `/dash/boost` | Buy, pay, track boosts |
| System | NotFound-\*, About-\*, Legal-\* (each + -EN), States, Empty-States, Admin-1440 | `/404` `/about` `/legal` `/admin` | 404, loading/offline/errors, empty lists, info, moderation |
| Share | OG-Item, OG-Shop, OG-InContext, Story-\*, Post-Top10 | OG image endpoints | Link previews and IG content |
| Handoff | Main, Cards, Tokens, Feat-Components, DashStates | — | Identity, components, tokens |

## Core flows

Each flow below runs in a straight line. The one branching flow, item status, is drawn under Rules & states.

**Shop onboarding** (SignIn → Onb-Import → Onb-Review → Onb-Shop → Onb-Live → Dash)

1. Connect Instagram. Only Business or Creator accounts work; any other account gets the boxed error on SignIn.
2. Import the latest posts into a 3-column grid, all selected by default. Posts whose caption marks them sold start deselected.
3. Review: parse each caption for price, size and category. Fields the parser filled get a ✦; missing ones get a lime outline, and the screen opens on the to-fix filter.
4. Shop profile: name, avatar and handle come from IG. The shop adds a pickup address and drop days and time, then sets the auto-sync and fast-reply switches.
5. Live: show the shop link with a copy button, plus share to IG Story or bio.

**IG sync** (worker)

1. Poll or webhook for new IG posts. With auto-publish on, a new post goes live; otherwise it waits in the dashboard's review queue (NEW).
2. A caption that changes to sold or "გაიყიდა" sets the item to SOLD.
3. A post deleted on IG hides the item. The shop can keep it from the Sync screen.
4. An expired token raises the red banner on the Sync screen and the "სინქი · 1" button on the dashboard.

**Shopper: find → save → DM**

1. Browse the feed or search. Filters are size, price and distance; sort is new, cheap or near.
2. The heart saves an item. A logged-out shopper gets the Auth sheet first: +995 phone and a 6-digit SMS code, or Google or Instagram.
3. DM opens the shop's Instagram DM. Nothing is paid on DEADSTOCK.

**Hold → SOLD** (shop)

1. From the dashboard row (⏳), pick the buyer from recent DMs or type a handle, then a length: 2h, 24h or 48h.
2. The item shows the hourglass, and DM stays available.
3. When the hold expires, the item goes back to LIVE. Shoppers who saved it can get a "hold freed" alert.
4. The shop marks it SOLD from the hold screen or the row.

**Drops**

1. The shop picks a day, a time and the items, which stay hidden until the drop.
2. The countdown appears on the shop page and in the Drops calendar. Followers get an alert 1 hour before, and an optional IG Story posts automatically.
3. At drop time the items go live and the drop shows LIVE.

**Alerts**

Shoppers set sizes, saved searches and followed shops. Delivery goes to the channels chosen in Notif (Push, Telegram, Email, SMS), instantly or as a daily digest. Quiet hours run 23:00–10:00, except for drop reminders the shopper turned on.

**Report**

The flag on the Item screen opens the Report sheet. The shopper picks one of 5 reasons and can add a note. The item hides automatically after 3 or more reports, and each report lands in the Admin queue, where moderators can hide the item, dismiss the report or ban the shop.

**BOOST** (paid)

1. The shop picks a placement (FEED, SEARCH or MAP) and a length (24h, 3d or 7d), then pays on the Pay sheet: saved card, Apple Pay or a new card.
2. On success the boost goes LIVE with a countdown and live views, saves and DMs. Failures show the "PAYMENT ✕" state.
3. Boosted items carry the lime ⚡ badge in the feed and search, and the ⚡ dot on map pins. Dash-Boosts lists the boost history with receipts.

## Data model

There are 11 tables (PostgreSQL + Drizzle). All prices are whole lari (₾) and all times are UTC timestamps.

| Table | Key fields | Notes |
| --- | --- | --- |
| `shop` | id, slug, name, ig\_user\_id, ig\_token (enc), avatar\_url, bio, address, lat, lng, drop\_days\[\], drop\_time, auto\_sync, auto\_publish, sold\_from\_caption, fast\_reply, verified, paused, created\_at | slug = subdomain |
| `item` | id, shop\_id, ig\_post\_id, title, price (null = "? ₾"), was\_price, size, condition, category, status, review, photos\[\], video, caption, posted\_at, drop\_id | status: live · hold · sold · hidden; review: new · ok · rejected |
| `hold` | id, item\_id, buyer\_handle, ends\_at, released\_at | one open hold per item |
| `drop` | id, shop\_id (null = community drop), starts\_at, story\_auto | items link through `item.drop_id` |
| `user` | id, phone, google\_id, ig\_id, lang, sizes jsonb, created\_at | shopper accounts |
| `saved` | user\_id, item\_id, created\_at | feeds price-drop alerts |
| `follow` | user\_id, shop\_id, bell | bell = drop alerts |
| `alert` | id, user\_id, kind (search · size · shop · price · hold), query jsonb, on | Notif sets channels on `user` |
| `report` | id, item\_id, user\_id, reason, note, status (open · hidden · dismissed), created\_at | auto-hide at 3+ open |
| `boost` | id, item\_id, placement (feed · search · map), starts\_at, ends\_at, payment\_id, views, saves, dms | ranks above organic |
| `payment` | id, shop\_id, amount, provider, provider\_ref, status (pending · paid · failed), receipt\_url | provider = Bank of Georgia |

## Rules & states

An item is always in one of 5 states: NEW, LIVE, HOLD, SOLD or HIDDEN. Only LIVE and HOLD items appear in the feed.

&#91;embedded content: item status · 5 states\]

SOLD items stay on the shop page under SOLD and on Saved. HIDDEN items stay visible only to the shop and to admins.

- **Caption parsing:** price is a number followed by ₾, ლარი or GEL, or after "ფასი:" or "Price:". Size is a letter size (XS–XL), W/L, or a shoe size between 34 and 46. Category comes from keywords plus the shop's history. Anything not found stays empty and is shown as "? ₾" or a lime outline.
- **Hold:** one open hold per item. When `ends_at` passes, the item returns to LIVE and "hold freed" alerts go out.
- **Price drop:** saving `price < was_price` alerts everyone who saved the item, and the card shows the ↓ pill with the amount saved.
- **BOOST ranking:** a boosted item takes the first slots of its placement. When several boosts compete, they rotate by `starts_at`. If the item goes SOLD or HIDDEN, the shop can move the boost to another item and keep the remaining time. There are no refunds.
- **Verified badge:** lime ✓, granted when the shop replies to DMs in under 30 minutes, has been active for at least 1 month, and puts a price in at least 90% of captions. Progress shows on Dash-Stats-1440.
- **Notifications:** sent on the user's channels; a daily digest batches them at a fixed hour; quiet hours hold them until 10:00.
- **Empty, loading and errors:** use Empty-States and States from the canvas. Skeletons show while loading. Offline still shows Saved. Failed actions get a red toast with RETRY, and a successful save gets a toast with UNDO.

## Tokens & components

All tokens and component classes are in `deadstock-tokens.css`. Use them as given; don't add raw hex values.

| Token | Value | Use |
| --- | --- | --- |
| `--ds-bg` | #0E0E0E | page ground |
| `--ds-surface` | #171716 | cards, sheets |
| `--ds-raised` | #222220 | chips, pressed |
| `--ds-line` | #2E2E2B | borders |
| `--ds-faint` | #6E6E68 | placeholders only (fails contrast for body text) |
| `--ds-muted` | #A3A39B | secondary text |
| `--ds-text` | #EDEDE8 | text, price tag |
| `--ds-lime` | #D4FF3A | accent, primary CTA, active, ⚡ |
| `--ds-error` | #FF6B4A | errors, report, delete |

- **Type:** Archivo (wordmark at 900 weight, 125% width), Noto Sans Georgian, and JetBrains Mono for Latin caps labels.
- **Card:** 4:5 photo, an off-white price tag rotated −3° with a punched dot, and "? ₾" when there's no price. Classes: `.ds-card`, `.ds-tag`.
- **Badges:** hold = lime hourglass circle; SOLD = stamp plus greyed photo; ▶ = video; ↓ = price drop (`.ds-drop`); ✓ = verified (`.ds-verified`); ⚡ = BOOST.
- **Save:** a heart button that sits beside the card link, not inside it (`.ds-card-wrap` + `.ds-save[aria-pressed]`).
- **Shared controls:** follow (`.ds-follow`), drop countdown and bell (`.ds-countdown`, `.ds-bell`), mobile tab bar (`.ds-tabbar`, hidden at 600px and wider).
- **Grain:** a CSS pseudo-element overlay (`.ds-grained::after`) at about 0.22 opacity. It must never catch clicks.
- **Motion:** a 150ms press scale; photos zoom on hover. Everything switches off under `prefers-reduced-motion`.

## Open decisions

All decisions are made and the canvas matches them. The only thing left is the lawyer's review of the terms and privacy draft.

- [x] BOOST prices: 3 ₾ for 24h, 7 ₾ for 3d, 12 ₾ for 7d. FEED, SEARCH and MAP cost the same.
- [x] Payment provider: Bank of Georgia
- [x] English: shopper side only, on mobile and desktop. Every shopper screen has an *-EN* version (canvas rows 20, 23 and 25); the shop dashboard stays Georgian
- [x] Desktop: every shop tool and shopper screen has a *-1440* version (canvas rows 21, 22 and 24)
- [x] Boosted item sells early: the boost moves to another item and keeps its remaining time. There is no refund (Dash-Boosts-375 MOVE card).
- [x] Verified badge: replies to DMs in under 30 minutes, active for at least 1 month, and at least 90% of captions include a price (Dash-Stats-1440)
- [ ] Terms and privacy: the Georgian draft is in Legal-\* and marked DRAFT · LAWYER REVIEW; Legal-\*-EN is a translation of it. Waiting on the lawyer's sign-off.
- [x] Contact email: support@deadstock.ge
