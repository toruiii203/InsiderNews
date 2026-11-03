-- Neon PostgreSQL Migration: 001_initial_schema.sql
-- Idempotent schema migration for InsiderNews

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Articles Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  is_breaking BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'EN',
  tags TEXT[] DEFAULT '{}',
  reading_time INTEGER DEFAULT 1,
  status TEXT DEFAULT 'published',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_status_published_at ON articles (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_is_breaking ON articles (is_breaking);

-- ── 2. Videos Table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  category TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos (published_at DESC);

-- ── 3. Staff / Writers Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  email TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_display_order ON staff (display_order ASC);

-- ── 4. About Us Content Table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about_content (
  id INTEGER PRIMARY KEY DEFAULT 1,
  heading TEXT DEFAULT 'About The Insider News Philippines',
  mission TEXT DEFAULT '',
  story TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO about_content (id, heading, mission, story)
VALUES (
  1,
  'About The Insider News Philippines',
  'We deliver fast, accurate, and independent news coverage for Filipinos — at home and abroad.',
  'The Insider News Philippines was founded to give readers a direct, no-spin source for the stories that matter most across the nation, regions, business, and entertainment.'
)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Subscribers Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);

-- ── 6. Polls Table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_polls_active_created_at ON polls (active, created_at DESC);

-- ── 7. Poll Votes Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  poll_id TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes (poll_id);

-- ── 8. Article Views Tracking Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_views (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  article_id TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_views_created_at ON article_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views (article_id);
