import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "edge"

export async function GET() {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const recent = await db.query(
      `SELECT article_id, COUNT(*)::int as count FROM article_views WHERE created_at >= $1 GROUP BY article_id`,
      [since24h]
    )

    const weekly = await db.query(
      `SELECT article_id, COUNT(*)::int as count FROM article_views WHERE created_at >= $1 GROUP BY article_id`,
      [since7d]
    )

    const last24h: Record<string, number> = {}
    for (const row of recent ?? []) {
      last24h[row.article_id] = Number(row.count)
    }

    const last7d: Record<string, number> = {}
    for (const row of weekly ?? []) {
      last7d[row.article_id] = Number(row.count)
    }

    return NextResponse.json({ last24h, last7d })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
