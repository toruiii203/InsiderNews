# Deploying InsiderNews to Cloudflare Pages

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables in Cloudflare Pages dashboard
Go to: **Cloudflare Dashboard → Workers & Pages → Pages → your project → Settings → Environment Variables**

Add these production variables:
```env
# Neon PostgreSQL (Pooled Connection String)
DATABASE_URL=postgres://neondb_owner:***@ep-***-pooler.aws-ap-southeast-1.neon.tech/neondb?sslmode=require

# Admin Authentication (Server-only secret password)
ADMIN_SECRET=your_secure_admin_password_here

# Site URL
NEXT_PUBLIC_SITE_URL=https://theinsidernewsph.com

# Cloudflare R2 Media Storage (Optional S3 API credentials for uploads)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=images

# Email (Resend)
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=newsletter@theinsiderph.com

# AI & Weather
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

### 3. Deploy via Cloudflare Pages Dashboard (Git Integration)
- Go to **Cloudflare Pages → Create a project → Connect Git**
- Choose the repository `toruiii203/InsiderNews`
- Set **Branch**: `main` (or `migration/neon-r2` during testing)
- Set **Framework preset**: `Next.js`
- Set **Build command**: `npx @cloudflare/next-on-pages`
- Set **Build output directory**: `.vercel/output/static`
- Add the environment variables listed above.

### 4. Or Deploy via Wrangler CLI
```bash
npm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name=insider-news
```

---

## Backend Infrastructure Overview

### 1. Neon Serverless PostgreSQL
The site data runs on Neon PostgreSQL (`@neondatabase/serverless`). All Next.js Edge runtime routes connect to Neon over HTTPS/WebSockets using pooled connections, providing instant scaling with zero connection exhaustion.

To run migrations or seed data:
```bash
node scripts/migrate.js
node scripts/seed-baseline.js
```

### 2. Cloudflare R2 Storage & CDN (`img.theinsidernewsph.com`)
All media uploads (images and video thumbnails) are stored in Cloudflare R2 and served through the edge caching CDN proxy at `https://img.theinsidernewsph.com/`.
- Client-side image compression downscales photos to max 1600px and converts to WebP before uploading.
- Responses are cached for 30 days (`max-age=31536000, public`).

### 3. Secure Admin Authentication
- Admin authentication is handled strictly server-side in `lib/session.ts` and `app/api/auth/login/route.ts`.
- Login requires `ADMIN_SECRET` and issues an encrypted, HTTP-only, SameSite=Strict cookie.
- Brute-force protection limits failed login attempts to 5 per 5 minutes per IP.
