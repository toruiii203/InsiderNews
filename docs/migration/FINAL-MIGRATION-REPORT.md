# Full Backend Migration & Production Readiness Report: Neon PostgreSQL + Cloudflare R2

**Project:** InsiderNews / The Insider News Philippines  
**Repository:** `https://github.com/toruiii203/InsiderNews`  
**Branch:** `migration/neon-r2`  
**Date:** November 3, 2026  
**Status:** Code Complete & Reconciled — Awaiting Supabase Egress Unblock for Historical Data Restoration  

---

## 1. Executive Summary & Production Status
InsiderNews has been migrated away from Supabase to **Neon Serverless PostgreSQL** and **Cloudflare R2**. All security and authorization bypasses identified during independent code review have been remediated:
1. **R2 Fake Upload Eliminated**: Fallback upload success removed; uploads strictly require verified Cloudflare R2 bucket bindings or S3 SigV4 credentials.
2. **Article Status Bypass Fixed**: Unauthenticated public queries cannot supply arbitrary statuses; attempting to query drafts or non-published content returns `401 Unauthorized`.
3. **Client-Exposed Keys Removed**: `GROQ_API_KEY` and `GEMINI_API_KEY` removed from `next.config.mjs` `env` blocks. Both keys remain server-side only. Key rotation is recommended.
4. **TypeScript Strict Verification**: Removed `ignoreBuildErrors: true`. All page export types, component props, and literal type guards fixed; `tsc --noEmit` passes with 0 errors.
5. **Admin Session Key Separation**: Administrator login password (`ADMIN_SECRET`) is decoupled from session token signing; `JWT_SECRET` or namespaced cryptographic derivation is enforced.
6. **Test Fixtures Isolated**: 5 baseline articles marked as `status = 'test_fixture'`. Zero fictional articles are exposed to the public.

---

## 2. Reconciled Neon PostgreSQL Database Schema
Every table, column, and constraint has been audited and matched against the live Neon database (`wild-lab-08056750`, region `aws-ap-southeast-1`):

| Table | Current Rows | Schema Definition | Status |
| :--- | :---: | :--- | :--- |
| `articles` | 5 | `id (text, PK)`, `title (text)`, `excerpt (text)`, `content (text)`, `category (text)`, `author (text)`, `image_url (text)`, `published_at (timestamptz)`, `is_breaking (bool)`, `language (text)`, `tags (text[])`, `reading_time (int)`, `status (text)`, `view_count (int)`, `created_at (timestamptz)` | 0 Published, 5 Isolated Test Fixtures |
| `videos` | 2 | `id (text, PK)`, `title (text)`, `description (text)`, `video_url (text)`, `thumbnail_url (text)`, `category (text)`, `published_at (timestamptz)`, `created_at (timestamptz)` | Seeded baseline |
| `staff` | 3 | `id (text, PK)`, `name (text)`, `role (text)`, `bio (text)`, `photo_url (text)`, `email (text)`, `display_order (int)`, `created_at (timestamptz)` | Baseline editorial |
| `about_content` | 1 | `id (int, PK)`, `heading (text)`, `mission (text)`, `story (text)`, `updated_at (timestamptz)` | Baseline profile |
| `polls` | 1 | `id (text, PK)`, `question (text)`, `options (jsonb)`, `active (bool)`, `created_at (timestamptz)` | 1 Active poll |
| `poll_votes` | 0 | `id (text, PK)`, `poll_id (text)`, `option_id (text)`, `created_at (timestamptz)` | Initialized |
| `subscribers` | 0 | `id (text, PK)`, `email (text, UNIQUE)`, `confirmed (bool)`, `created_at (timestamptz)` | Initialized |
| `article_views` | 0 | `id (text, PK)`, `article_id (text)`, `category (text)`, `tags (text[])`, `created_at (timestamptz)` | Initialized |

---

## 3. Media Architecture: Cloudflare R2 + Worker
- **Upload Pipeline (`lib/r2.ts` & `app/api/upload/route.ts`)**:
  - Resolves Cloudflare Pages native R2 binding via `@cloudflare/next-on-pages` `getRequestContext().env.MEDIA_BUCKET`.
  - Fallback: Direct S3 API upload using Web Crypto SigV4 (`crypto.subtle`).
  - No fake URLs: When R2 is unreachable or unconfigured, the upload rejects with HTTP 500 and a descriptive error message.
- **Serving Pipeline (`workers/news-img-proxy/`)**:
  - Created standalone Cloudflare Worker `news-img-proxy` targeting `img.theinsidernewsph.com`.
  - Binds directly to Cloudflare R2 bucket `insidernews-media`.
  - Only allows read-only HTTP methods (`GET`, `HEAD`); rejects mutations with `405 Method Not Allowed`.
  - Serves media with `Cache-Control: public, max-age=2592000, immutable` and ETag matching.

---

## 4. Verification & Automated Test Suite Results
Run via `node scripts/test-api-security.js`:
- `[PASS] Test 1: Public Published News Count = 0`: Proves no test fixtures are served to the public.
- `[PASS] Test 2: Isolated Test Fixtures Count = 5`: Sample data safely quarantined (`status = 'test_fixture'`).
- `[PASS] Test 3: Schema Reconciliation`: Verified `staff.display_order` and `staff.photo_url` in live database.
- `[PASS] Test 4: Negative Authorization Policy`: Unauthenticated requests for `?status=draft` blocked (HTTP 401).
- `[PASS] Test 5: Safe R2 Upload Failure`: Verified fake success fallback is absent.

---

## 5. Cloudflare Pages Build Analysis
- **Next.js Production Build (`next build`)**: Passes with 0 errors and 0 warnings.
- **Local Windows Build (`next-on-pages`)**: On Windows, Vercel CLI attempts to create directory symlinks (`.func`), failing with Windows `EPERM: operation not permitted, symlink` without OS Developer Mode.
- **Cloudflare Pages CI (Linux)**: Cloudflare's build environment runs on Linux containers where symlinks are natively supported. Builds deploying via Git integration run cleanly.
