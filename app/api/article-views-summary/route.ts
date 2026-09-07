// app/api/article-views-summary/route.ts
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"

// Service role key — same reasoning as /api/trending: article_views only allows
// inserts from anon/authenticated clients, reads happen server-side only.


export async function GET() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recent, error: recentError } = await supabase
    .from("article_views")
    .select("article_id")
    .gte("created_at", since24h)

  if (recentError) {
    return NextResponse.json({ error: recentError.message }, { status: 500 })
  }

  const { data: weekly, error: weeklyError } = await supabase
    .from("article_views")
    .select("article_id")
    .gte("created_at", since7d)

  if (weeklyError) {
    return NextResponse.json({ error: weeklyError.message }, { status: 500 })
  }

  const last24h: Record<string, number> = {}
  for (const row of recent ?? []) {
    last24h[row.article_id] = (last24h[row.article_id] || 0) + 1
  }

  const last7d: Record<string, number> = {}
  for (const row of weekly ?? []) {
    last7d[row.article_id] = (last7d[row.article_id] || 0) + 1
  }

  return NextResponse.json({ last24h, last7d })
}
