export const runtime = "edge"

import { NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { query, queryOne } from "@/lib/db"

async function isAuthorized() {
  return !!(await verifySession())
}

// GET /api/videos?limit=100 — list videos, newest first
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit")) || 100), 200)

    const videos = await query(
      "SELECT * FROM videos ORDER BY published_at DESC LIMIT $1;",
      [limit]
    )

    return NextResponse.json({ videos })
  } catch (err: any) {
    console.error("[API Videos GET] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/videos — create a new video
export async function POST(request: Request) {
  try {
    if (!await isAuthorized()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, video_url, thumbnail_url, category, published_at } = body

    if (!title || !description || !video_url || !thumbnail_url || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const video = await queryOne(
      `
      INSERT INTO videos (title, description, video_url, thumbnail_url, category, published_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [
        title,
        description,
        video_url,
        thumbnail_url,
        category,
        published_at ?? new Date().toISOString(),
      ]
    )

    return NextResponse.json({ video }, { status: 201 })
  } catch (err: any) {
    console.error("[API Videos POST] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH /api/videos — update a video
export async function PATCH(request: Request) {
  try {
    if (!await isAuthorized()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, description, video_url, thumbnail_url, category, published_at } = body

    if (!id) {
      return NextResponse.json({ error: "Missing video id" }, { status: 400 })
    }

    const video = await queryOne(
      `
      UPDATE videos
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          video_url = COALESCE($3, video_url),
          thumbnail_url = COALESCE($4, thumbnail_url),
          category = COALESCE($5, category),
          published_at = COALESCE($6, published_at)
      WHERE id = $7
      RETURNING *;
      `,
      [title, description, video_url, thumbnail_url, category, published_at, id]
    )

    return NextResponse.json({ video })
  } catch (err: any) {
    console.error("[API Videos PATCH] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/videos — delete a video
export async function DELETE(request: Request) {
  try {
    if (!await isAuthorized()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing video id" }, { status: 400 })
    }

    await query("DELETE FROM videos WHERE id = $1", [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[API Videos DELETE] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
