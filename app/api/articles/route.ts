export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { query, queryOne } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)), 200)
    const id = searchParams.get("id")
    const requestedStatus = searchParams.get("status")

    const session = await verifySession()

    // Public / Unauthenticated callers:
    // Strictly restrict to published articles whose publication date has passed.
    // If an unauthenticated caller specifically requests drafts, scheduled, or non-published content, reject with 401.
    if (!session) {
      if (requestedStatus && requestedStatus !== "published") {
        return NextResponse.json(
          { error: "Unauthorised: Access to drafts and scheduled articles requires administrator authentication." },
          { status: 401 }
        )
      }
    }

    const status = session && requestedStatus ? requestedStatus : "published"

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status !== "all") {
      conditions.push(`status = $${paramIndex++}`)
      params.push(status)
    }

    // Public readers can only ever see published articles with published_at in the past
    if (!session || status === "published") {
      conditions.push(`published_at <= $${paramIndex++}`)
      params.push(new Date().toISOString())
    }

    if (category && category !== "All") {
      conditions.push(`LOWER(category) = LOWER($${paramIndex++})`)
      params.push(category)
    }

    if (id) {
      conditions.push(`id = $${paramIndex++}`)
      params.push(id)
    }

    params.push(limit)
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const sql = `
      SELECT * FROM articles
      ${whereClause}
      ORDER BY published_at DESC
      LIMIT $${paramIndex}
    `

    const articles = await query(sql, params)
    return NextResponse.json({ articles }, { headers: { "Cache-Control": session ? "private, no-cache" : "public, s-maxage=60, stale-while-revalidate=300" } })
  } catch (err: any) {
    console.error("[API Articles GET] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    const body = await req.json()

    const article = await queryOne(
      `
      INSERT INTO articles (
        title, excerpt, content, category, author, image_url,
        published_at, is_breaking, language, tags, reading_time, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
      `,
      [
        body.title,
        body.excerpt ?? "",
        body.content ?? "",
        body.category,
        body.author ?? "Staff Reporter",
        body.image_url ?? "",
        body.published_at ?? new Date().toISOString(),
        body.is_breaking ?? false,
        body.language ?? "en",
        body.tags ?? [],
        body.reading_time ?? 3,
        body.status ?? "draft",
      ]
    )

    return NextResponse.json({ article }, { status: 201 })
  } catch (err: any) {
    console.error("[API Articles POST] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Missing article id" }, { status: 400 })
    }

    const setClauses: string[] = []
    const params: any[] = []
    let idx = 1

    const allowedFields = [
      "title", "excerpt", "content", "category", "author",
      "image_url", "published_at", "is_breaking", "language",
      "tags", "reading_time", "status", "view_count"
    ]

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${idx++}`)
        params.push(updates[field])
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    params.push(id)
    const sql = `
      UPDATE articles
      SET ${setClauses.join(", ")}
      WHERE id = $${idx}
      RETURNING *;
    `

    const article = await queryOne(sql, params)
    return NextResponse.json({ article })
  } catch (err: any) {
    console.error("[API Articles PATCH] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export { PATCH as PUT }

export async function DELETE(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Missing article id" }, { status: 400 })
    }

    await query("DELETE FROM articles WHERE id = $1;", [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[API Articles DELETE] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
