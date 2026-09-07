import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("id, title, published_at, view_count, image_url")
    .like("image_url", "blob:%")
    .order("view_count", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    message: `Found ${data.length} articles with blob: URLs.`,
    affected_articles: data,
    instructions: "Send a POST request to this endpoint to clear the image_url for these articles."
  })
}

export async function POST(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { data: articles, error: fetchError } = await supabaseAdmin
    .from("articles")
    .select("id")
    .like("image_url", "blob:%")

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  if (!articles || articles.length === 0) {
    return NextResponse.json({ message: "No articles found with blob: URLs." })
  }

  let successCount = 0
  let failCount = 0

  for (const article of articles) {
    const { error: updateError } = await supabaseAdmin
      .from("articles")
      .update({ image_url: "" })
      .eq("id", article.id)
      
    if (updateError) failCount++
    else successCount++
  }

  return NextResponse.json({
    message: "Migration complete.",
    success_count: successCount,
    fail_count: failCount
  })
}
