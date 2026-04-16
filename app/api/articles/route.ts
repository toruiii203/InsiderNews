export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const limit = parseInt(searchParams.get("limit") ?? "50")
  const id = searchParams.get("id")

  let query = supabaseAdmin
    .from("articles")
    .select("*")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit)

  if (category) query = query.ilike("category", category)
  if (id) query = query.eq("id", id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data ?? [] })
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert({
      title: body.title, excerpt: body.excerpt, content: body.content,
      category: body.category, author: body.author, image_url: body.image_url,
      published_at: body.published_at, is_breaking: body.is_breaking ?? false,
      language: body.language ?? "EN", tags: body.tags ?? [],
      reading_time: body.reading_time ?? 1, status: body.status ?? "published",
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ article: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabaseAdmin.from("articles").update(updates).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ article: data })
}

export async function DELETE(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  const { id } = await req.json()
  const { error } = await supabaseAdmin.from("articles").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
