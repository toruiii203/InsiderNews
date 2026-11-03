# Full Backend Migration Report: Neon PostgreSQL + Cloudflare R2

**Project:** InsiderNews / The Insider News Philippines  
**Repository:** `https://github.com/toruiii203/InsiderNews`  
**Branch:** `migration/neon-r2`  
**Date:** November 3, 2026  
**Status:** Complete & Verified  

---

## Executive Summary
InsiderNews has been fully decoupled from Supabase following project quota restrictions. The entire backend has been migrated to **Neon Serverless PostgreSQL** and **Cloudflare R2** with Cloudflare Pages Edge runtime compatibility. All user-facing designs, article routes, metadata, and editorial CMS administration workflows remain completely preserved.

---

## 1. Neon PostgreSQL Database Architecture
- **Provider:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Region:** `aws-ap-southeast-1` (Singapore)
- **Tables Provisioned:**
  1. `articles` (id, title, slug, content, excerpt, category, author, image_url, published_at, is_breaking, language, tags, reading_time, view_count, status, created_at, updated_at)
  2. `videos` (id, title, description, category, video_url, thumbnail_url, duration, author, published_at, view_count, created_at, updated_at)
  3. `staff` (id, name, role, department, bio, email, avatar_url, twitter, linkedin, order_index, is_active, created_at, updated_at)
  4. `about_content` (id, mission, vision, history, editorial_policy, ethics_code, address, phone, email, updated_at)
  5. `polls` (id, question, options JSONB, active, created_at, updated_at)
  6. `poll_votes` (id, poll_id, option_id, created_at)
  7. `subscribers` (id, email UNIQUE, confirmed, created_at)
  8. `article_views` (id, article_id, category, tags JSONB, created_at)
- **Migrations & Scripts:**
  - `sql/migrations/001_initial_schema.sql`: Complete idempotent DDL script.
  - `scripts/migrate.js`: Node migration runner against `DATABASE_URL`.
  - `scripts/seed-baseline.js`: Seeds baseline articles, videos, staff, and about content.
  - `scripts/verify-neon.js`: Validates table integrity and row counts.

---

## 2. Cloudflare R2 & Media Delivery Architecture
- **Storage:** Cloudflare R2 S3-compatible bucket (`images` / `insidernews-media`)
- **Edge Uploader:** `app/api/upload/route.ts` powered by `lib/r2.ts` using native Web Crypto AWS SigV4 PUT and Cloudflare Pages bindings.
- **CDN Proxy:** `https://img.theinsidernewsph.com/` maps to media objects with a 30-day edge cache.
- **Client Compression:** Images uploaded via the admin panel are downscaled to max 1600px and converted to WebP (`lib/compress-image.ts`), keeping uploads under 5 MB.

---

## 3. Security & Admin Authentication Hardening
- **Server-Side Session:** Replaced insecure secrets with server-only `ADMIN_SECRET` in `lib/session.ts`.
- **Removed Client Exposure:** Cleaned out all client references to `NEXT_PUBLIC_ADMIN_SECRET`.
- **Cookies:** Strict `HttpOnly`, `SameSite=Strict`, `Secure` in production, expiring in 24 hours.
- **Brute Force Protection:** Implemented in-memory rate-limiting on `POST /api/auth/login` (5 attempts per 5 minutes per IP).

---

## 4. UI Fixes & Branding Restorations
- **Unicode Build Error:** Fixed `Expected unicode escape` error in `components/header.tsx` caused by corrupted characters.
- **Logo & Favicon:**
  - Converted the authentic user-provided logo (`media_1788491429783.jpg`) to true PNG format (`public/tinph-logo-v2.png`).
  - Generated true multi-resolution ICO file (`app/favicon.ico`, `public/favicon.ico`).
  - Added cache-busted favicon metadata (`?v=2`) in `app/layout.tsx`.
- **Dynamic Weather:** Wired weather display directly to live weather conditions fetched from Open-Meteo and GeoJS.
- **Breaking News Marquee:** Fixed mobile touch freezing by scoping hover pauses to `@media (hover: hover)` and expanding repeating items for seamless infinite scrolling.

---

## 5. Deployment Instructions for Cloudflare Pages
Add the following Environment Variables in the Cloudflare Pages Dashboard:
1. `DATABASE_URL`: Your Neon pooled connection string (`postgres://...pooler.aws-ap-southeast-1.neon.tech/...`).
2. `ADMIN_SECRET`: Strong secret passphrase for editorial admin login.
3. `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`: Cloudflare R2 S3 API credentials.
4. `RESEND_API_KEY`: Resend API key for newsletter notifications.
5. `NEXT_PUBLIC_SITE_URL`: `https://theinsidernewsph.com`
