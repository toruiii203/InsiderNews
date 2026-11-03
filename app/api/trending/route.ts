import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "edge"

const WINDOW_HOURS = 24
const MAX_TOPICS = 10

export async function GET() {
  try {
    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()

    const rows = await db.query(
      `SELECT category, tags FROM article_views WHERE created_at >= $1`,
      [since]
    )

    const tagMap = new Map<string, { count: number; category: string }>()

    for (const row of rows ?? []) {
      if (row.category) {
        const existing = tagMap.get(row.category)
        tagMap.set(row.category, {
          count: (existing?.count || 0) + 3,
          category: row.category,
        })
      }
      const tagsList = Array.isArray(row.tags) ? row.tags : (typeof row.tags === "string" ? JSON.parse(row.tags) : [])
      for (const tag of tagsList ?? []) {
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
