import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { articleId, category, tags } = await req.json()

    if (!articleId || typeof articleId !== "string") {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 })
    }

    await db.query(
      `INSERT INTO article_views (article_id, category, tags) VALUES ($1, $2, $3)`,
      [articleId, category ?? null, Array.isArray(tags) ? tags : null]
    )

    // Increment article view_count
    await db.query(
      `UPDATE articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1`,
      [articleId]
    ).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid request" }, { status: 400 })
  }
}
