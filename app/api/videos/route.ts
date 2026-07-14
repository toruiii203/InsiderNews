import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "edge"

// NOTE: adjust this to whatever /api/articles/route.ts actually checks
// server-side (likely process.env.ADMIN_SECRET). Checking both here so
// this works whether you kept one env var or split it into a public +
// server pair.
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET

function isAuthorized(request: Request) {
  const header = request.headers.get("x-admin-secret")
  return !!ADMIN_SECRET && header === ADMIN_SECRET
}

// GET /api/videos?limit=100 — list videos, newest first
// Public endpoint: reads are unauthenticated on purpose so the homepage
// and other public pages can fetch videos without shipping the admin
// secret to the browser. Only writes (POST/PATCH/DELETE) require it.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit")) || 100

  const { data, error } = await supabaseAdmin
    .from("videos")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ videos: data })
}

// POST /api/videos — create a new video
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, video_url, thumbnail_url, category, published_at } = body

  if (!title || !description || !video_url || !thumbnail_url || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("videos")
    .insert({
      title,
      description,
      video_url,
      thumbnail_url,
      category,
      published_at: published_at ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ video: data })
}

// PATCH /api/videos — update a video (id included in body, like /api/articles)
export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { id, title, description, video_url, thumbnail_url, category, published_at } = body

  if (!id) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("videos")
    .update({ title, description, video_url, thumbnail_url, category, published_at })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ video: data })
}

// DELETE /api/videos — body: { id }
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: "Missing video id" }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from("videos").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
