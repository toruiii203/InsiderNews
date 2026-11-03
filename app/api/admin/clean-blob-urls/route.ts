import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { db } from "@/lib/db"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  try {
    const data = await db.query(
      `SELECT id, title, published_at, view_count, image_url FROM articles WHERE image_url LIKE 'blob:%' ORDER BY view_count DESC`
    )

    return NextResponse.json({
      message: `Found ${data.length} articles with blob: URLs.`,
      affected_articles: data,
      instructions: "Send a POST request to this endpoint to clear the image_url for these articles."
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  try {
    const result = await db.query(
      `UPDATE articles SET image_url = '' WHERE image_url LIKE 'blob:%' RETURNING id`
    )

    return NextResponse.json({
      message: "Migration complete.",
      success_count: result.length,
      fail_count: 0
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
