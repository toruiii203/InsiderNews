-- ── Staff / Writers table ────────────────────────────────────────────────
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,              -- e.g. "Editor-in-Chief", "Staff Writer"
  bio text default '',
  photo_url text default '',
  email text default '',
  display_order int default 0,     -- lower shows first
  created_at timestamptz default now()
);

alter table staff enable row level security;

create policy "Public can view staff"
  on staff for select
  using (true);

create table if not exists about_content (
  id int primary key default 1,
  heading text default 'About The Insider News Philippines',
  mission text default '',
  story text default '',
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into about_content (id, heading, mission, story)
values (
  1,
  'About The Insider News Philippines',
  'We deliver fast, accurate, and independent news coverage for Filipinos — at home and abroad.',
  'The Insider News Philippines was founded to give readers a direct, no-spin source for the stories that matter most across the nation, regions, business, and entertainment.'
)
on conflict (id) do nothing;

alter table about_content enable row level security;

create policy "Public can view about content"
  on about_content for select
  using (true);
