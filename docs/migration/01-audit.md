# Phase 1: Comprehensive Codebase & Architecture Audit

**Project:** InsiderNews / The Insider News Philippines  
**Repository:** `https://github.com/toruiii203/InsiderNews`  
**Branch:** `migration/neon-r2` (branched from `main` @ `14136ff`)  
**Audit Date:** November 3, 2026  
**Auditor:** Lead Backend & Infrastructure Migration Specialist  

---

## 1. Executive Summary

InsiderNews is a Next.js (App Router, v15.2.4) news publication deployed to **Cloudflare Pages** utilizing Edge Runtime (`export const runtime = 'edge'`). The original backend architecture relied on **Supabase** for two distinct functions:
1. **PostgreSQL Database** via PostgREST / `@supabase/supabase-js`
2. **Supabase Storage** for media uploads (`images` and `videos` buckets)

The Supabase project (`dyamlsfldhjpimdlixfc`) is currently restricted (HTTP 402, `exceed_cached_egress_quota` exceeding the 5 GB quota). Furthermore, the application previously uploaded raw uncompressed media up to 10 MB per image and 200 MB per video, exacerbating storage and egress exhaustion.

This audit details all components, API routes, database schemas, authentication systems, storage mechanisms, and third-party dependencies required for complete migration to **Neon PostgreSQL** and **Cloudflare R2**.

---

## 2. Next.js & Cloudflare Runtime Architecture

- **Framework**: Next.js 15.2.4 with Tailwind CSS v4 and TypeScript.
- **Hosting Platform**: Cloudflare Pages via `@cloudflare/next-on-pages` (`.vercel/output/static`).
- **Runtime**: Nearly all API routes and dynamic pages specify `export const runtime = 'edge'`.
- **Database Driver Consideration**: 
  - On Cloudflare Pages Edge Runtime, standard Node.js TCP socket drivers (`pg`) cannot connect directly without Cloudflare Hyperdrive or WebSocket polyfills.
  - The official `@neondatabase/serverless` driver is specifically engineered for Edge / Cloudflare Workers runtimes, utilizing either HTTP one-shot queries (`neon()`) or serverless connection pooling via WebSockets.
  - This makes `@neondatabase/serverless` the optimal drop-in database client for Neon across all Edge API routes and server components.

---

## 3. Comprehensive Database Schema Inventory

From our code and SQL audit, 8 distinct database tables are used across the website:

### 3.1. `articles`
- **Purpose**: Core publication content, metadata, editorial workflows, and metrics.
- **Fields**:
  - `id`: `uuid` or `text` (PRIMARY KEY, default `gen_random_uuid()`)
  - `title`: `text NOT NULL`
  - `excerpt`: `text`
  - `content`: `text` (HTML formatted article body)
  - `category`: `text NOT NULL` (`Nation`, `Regions`, `Feature`, `Metro`, `Business`, `Entertainment`, `International`, `Tourism`)
  - `author`: `text NOT NULL`
  - `image_url`: `text`
  - `published_at`: `timestamptz DEFAULT now()`
  - `is_breaking`: `boolean DEFAULT false`
  - `language`: `text DEFAULT 'EN'` (`EN` or `FIL`)
  - `tags`: `text[] DEFAULT '{}'`
  - `reading_time`: `integer DEFAULT 1`
  - `status`: `text DEFAULT 'published'` (`published`, `draft`, `scheduled`)
  - `view_count`: `integer DEFAULT 0`
  - `created_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Filtering by `status = 'published'` and `published_at <= now()`.
  - Pagination and sorting by `published_at DESC`.
  - Category filtering (`ilike('category', ...)`).
  - Scheduling support (`status = 'scheduled'` and future `published_at`).
  - Search by title, excerpt, content, tags, author.

### 3.2. `videos`
- **Purpose**: Video news feed and featured video player section.
- **Fields**:
  - `id`: `uuid` (PRIMARY KEY, default `gen_random_uuid()`)
  - `title`: `text NOT NULL`
  - `description`: `text`
  - `video_url`: `text NOT NULL` (YouTube URL or uploaded video path)
  - `thumbnail_url`: `text NOT NULL`
  - `category`: `text NOT NULL`
  - `published_at`: `timestamptz DEFAULT now()`
  - `created_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Public listing ordered by `published_at DESC`.
  - Admin CRUD.

### 3.3. `staff`
- **Purpose**: Editorial and writer profiles rendered on `/about`.
- **Fields**:
  - `id`: `uuid` (PRIMARY KEY, default `gen_random_uuid()`)
  - `name`: `text NOT NULL`
  - `role`: `text NOT NULL` (e.g., "Editor-in-Chief", "Staff Writer")
  - `bio`: `text DEFAULT ''`
  - `photo_url`: `text DEFAULT ''`
  - `email`: `text DEFAULT ''`
  - `display_order`: `integer DEFAULT 0`
  - `created_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Public listing ordered by `display_order ASC`.
  - Admin CRUD.

### 3.4. `about_content`
- **Purpose**: Singleton CMS content block for mission statement and story on `/about`.
- **Fields**:
  - `id`: `integer PRIMARY KEY DEFAULT 1 CHECK (id = 1)`
  - `heading`: `text DEFAULT 'About The Insider News Philippines'`
  - `mission`: `text DEFAULT ''`
  - `story`: `text DEFAULT ''`
  - `updated_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Public read `id = 1`.
  - Admin `PATCH` updates.

### 3.5. `subscribers`
- **Purpose**: Newsletter subscription management.
- **Fields**:
  - `id`: `uuid` (PRIMARY KEY, default `gen_random_uuid()`)
  - `email`: `text UNIQUE NOT NULL`
  - `confirmed`: `boolean DEFAULT false`
  - `created_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Public signup (`POST /api/subscribe` with duplicate prevention on code `23505`).
  - Admin subscriber list retrieval and unsubscription.

### 3.6. `polls`
- **Purpose**: Active reader question and voting choices on the homepage.
- **Fields**:
  - `id`: `uuid` (PRIMARY KEY, default `gen_random_uuid()`)
  - `question`: `text NOT NULL`
  - `options`: `jsonb NOT NULL` (JSON array of `{ id: string, text: string }`)
  - `active`: `boolean DEFAULT true`
  - `created_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Read active poll (`active = true ORDER BY created_at DESC LIMIT 1`).

### 3.7. `poll_votes`
- **Purpose**: Individual votes cast by readers.
- **Fields**:
  - `id`: `uuid` (PRIMARY KEY, default `gen_random_uuid()`)
  - `poll_id`: `uuid REFERENCES polls(id) ON DELETE CASCADE`
  - `option_id`: `text NOT NULL`
  - `created_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Voting insert (`POST /api/poll/vote`).
  - Aggregate count query (`SELECT option_id, COUNT(*) FROM poll_votes WHERE poll_id = ... GROUP BY option_id`).

### 3.8. `article_views`
- **Purpose**: Real-time reader view logging for analytics, trending topics, and view counts.
- **Fields**:
  - `id`: `uuid` (PRIMARY KEY, default `gen_random_uuid()`)
  - `article_id`: `text NOT NULL`
  - `category`: `text`
  - `tags`: `text[]`
  - `created_at`: `timestamptz DEFAULT now()`
- **Key Operations**:
  - Tracking insert (`POST /api/track-view`).
  - Trending calculation (`GET /api/trending` filtering `created_at >= now() - interval '24 hours'`).
  - Summary views (`GET /api/article-views-summary` aggregate over 24h and 7d).

---

## 4. Supabase Usage & Code Reference Matrix

| Location | Type of Supabase Interaction | Target Table / Bucket | Migration Action |
|---|---|---|---|
| `lib/supabase.ts` | Client initialization (`createClient`) | Entire Supabase instance | **Remove / Replace** with `@neondatabase/serverless` connection pool |
| `app/api/articles/route.ts` | CRUD Queries | `articles` | Migrate to SQL queries via Neon |
| `app/api/articles/all/route.ts` | Paginated full retrieval | `articles` | Migrate to SQL query via Neon (no PostgREST 1000 row limits) |
| `app/article/[id]/page.tsx` | Detail & related articles query | `articles` | Migrate server-side queries to Neon |
| `app/category/[slug]/page.tsx` | Category article queries | `articles` | Migrate server-side queries to Neon |
| `app/api/videos/route.ts` | Video CRUD | `videos` | Migrate to SQL queries via Neon |
| `app/videos/page.tsx` | Video listing query | `videos` | Migrate server-side query to Neon |
| `app/api/about/route.ts` | About content read/update | `about_content` | Migrate to SQL queries via Neon |
| `app/about/page.tsx` | Staff & about queries | `about_content`, `staff` | Migrate server-side query to Neon |
| `app/api/staff/route.ts` | Staff CRUD | `staff` | Migrate to SQL queries via Neon |
| `app/api/subscribe/route.ts` | Newsletter CRUD | `subscribers` | Migrate to SQL queries via Neon |
| `app/api/notify/route.ts` | Subscriber notification email | `subscribers` | Migrate to SQL queries via Neon |
| `app/api/poll/active/route.ts` | Poll & vote aggregation | `polls`, `poll_votes` | Migrate to SQL queries via Neon |
| `app/api/poll/vote/route.ts` | Poll voting insert | `poll_votes` | Migrate to SQL queries via Neon |
| `app/api/track-view/route.ts` | View count logging | `article_views` | Migrate to SQL queries via Neon |
| `app/api/trending/route.ts` | Trending tag calculation | `article_views` | Migrate to SQL queries via Neon |
| `app/api/article-views-summary/route.ts` | 24h & 7d view summaries | `article_views` | Migrate to SQL queries via Neon |
| `app/api/admin/clean-blob-urls/route.ts` | Legacy utility | `articles` | Migrate / deprecate safely |
| `app/api/upload/route.ts` | Media storage upload | Supabase Storage (`images`, `videos`) | **Migrate to Cloudflare R2** via S3 SDK or R2 binding |
| `lib/cdn.ts` | URL prefix replacement | Storage public URLs | Update to resolve R2 CDN URLs (`img.theinsidernewsph.com`) |

---

## 5. Media Storage & Delivery Architecture

### Current State:
- Admin uploads go to `/api/upload`.
- `/api/upload` uses `supabase.storage.from(bucket).upload()`.
- Commit `14136ff` compressed images client-side before sending and prefixed rendered URLs with `https://img.theinsidernewsph.com/`, but the Cloudflare Worker merely acts as a reverse proxy pointing to Supabase Storage:
  `https://img.theinsidernewsph.com/<bucket>/<path>` → `https://dyamlsfldhjpimdlixfc.supabase.co/storage/v1/object/public/<bucket>/<path>`.
- Because Supabase blocked the organization for exceeding egress, public requests through the worker will fail whenever the CDN cache misses or expires.

### Target Architecture (Phase 5):
1. **Upload Target**: `/api/upload` uploads directly to **Cloudflare R2** using standard S3 API (`@aws-sdk/client-s3`) or Cloudflare Workers R2 bindings.
2. **Public CDN**: Cloudflare Worker (`news-img-proxy`) or custom domain mapping routes `https://img.theinsidernewsph.com/<bucket>/<path>` directly to Cloudflare R2 bucket.
3. **Zero Supabase Storage Dependency**: Supabase is removed completely from the upload and delivery lifecycle.

---

## 6. Authentication & Security Audit

### Current State:
- Admin login uses JWT session cookies handled by `lib/session.ts` via `jose`.
- `app/api/auth/login/route.ts` validates against `ADMIN_SECRET` or `NEXT_PUBLIC_ADMIN_SECRET`.
- `lib/session.ts` contains:
  ```ts
  const getKey = () => {
    const secretKey = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "fallback_secret_for_development"
    return new TextEncoder().encode(secretKey)
  }
  ```
- Vulnerabilities / Issues Identified:
  1. `NEXT_PUBLIC_ADMIN_SECRET` was historically exposed to browser-side bundles.
  2. Fallback `"fallback_secret_for_development"` allows forged sessions if env vars are unset.
  3. No rate limiting on `/api/auth/login`.
  4. Content deletion and writes depend on `verifySession()`.

### Target Hardening (Phase 6):
- Strictly require server-only `ADMIN_SECRET` (throw error in production if missing; never fall back to insecure defaults).
- Completely purge any browser exposure of admin secrets.
- Add basic in-memory or IP-based login rate limiting.
- Retain seamless admin session validation so editorial workflows remain familiar and uninterrupted.

---

## 7. Migration Roadmap

1. **Phase 2: Data Preservation & Backup Audit**:
   Verify accessible data backups, local mock baselines, and extraction avenues from Supabase.
2. **Phase 3: Neon PostgreSQL Provisioning & Schema Migration**:
   Create repeatable SQL migration files, establish `@neondatabase/serverless` connection layer with zero client-side exposure.
3. **Phase 4: Database Query Migration**:
   Replace `@supabase/supabase-js` database calls across all 15 API routes and server components with type-safe Neon queries.
4. **Phase 5: Cloudflare R2 Media Migration**:
   Update `/api/upload` to write directly to Cloudflare R2 bucket and configure R2 public delivery.
5. **Phase 6: Admin Authentication Hardening**:
   Enforce server-only secret verification and eliminate fallback vulnerabilities.
6. **Phase 7 - 9: Cloudflare Pages Integration, Full Test Verification & Cutover**.
