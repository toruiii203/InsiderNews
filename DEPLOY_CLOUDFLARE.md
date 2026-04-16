# Deploying to Cloudflare Pages

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables in Cloudflare Pages dashboard
Go to: Pages → your project → Settings → Environment Variables

Add these variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_SECRET=your_admin_password
NEXT_PUBLIC_ADMIN_SECRET=your_admin_password
NEXT_PUBLIC_SITE_URL=https://your-domain.pages.dev
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=your_from_email
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_OPENWEATHER_KEY=your_openweather_key
```

### 3. Deploy via Cloudflare Pages dashboard (recommended)
- Go to Cloudflare Pages → Create a project → Connect Git
- Set **Framework preset**: `Next.js`
- Set **Build command**: `npx @cloudflare/next-on-pages`
- Set **Build output directory**: `.vercel/output/static`
- Add all environment variables above

### 4. Or deploy via CLI
```bash
npm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name=insider-news
```

## Admin Login Fix (what was changed)

The original code stored all admin accounts in `localStorage`, which meant:
- Each browser/device started with a **fresh** account list
- Anyone on a new browser couldn't log in with credentials created elsewhere

**Fix:** The `admin` / superadmin login now checks `NEXT_PUBLIC_ADMIN_SECRET`
from your environment variables first. That credential works on **every** device.
Additional accounts added via the admin panel are still stored in localStorage
(they're per-browser by design for extra accounts).

**Default credentials:**
- Username: `admin`
- Password: value of `NEXT_PUBLIC_ADMIN_SECRET` (set in Cloudflare env vars)
