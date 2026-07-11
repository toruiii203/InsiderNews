// app/api/trending/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "edge"

// Service role key — this route reads article_views, which anon/authenticated
// clients aren't allowed to select directly (see the RLS policy in the migration).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WINDOW_HOURS = 24
const MAX_TOPICS = 10

export async function GET() {
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("article_views")
    .select("category, tags")
    .gte("created_at", since)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const tagMap = new Map<string, { count: number; category: string }>()

  for (const row of data ?? []) {
    if (row.category) {
      const existing = tagMap.get(row.category)
      tagMap.set(row.category, {
        count: (existing?.count || 0) + 3, // category views count for less than a specific tag match
        category: row.category,
      })
    }
    for (const tag of row.tags ?? []) {
      const existing = tagMap.get(tag)
      tagMap.set(tag, {
        count: (existing?.count || 0) + 1,
        category: row.category ?? existing?.category ?? "General",
      })
    }
  }

  const topics = Array.from(tagMap.entries())
    .map(([tag, { count, category }]) => ({ tag, count, category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TOPICS)

  return NextResponse.json({ topics })
}
