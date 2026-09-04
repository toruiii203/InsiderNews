export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Admin endpoint - returns ALL articles including scheduled
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  let allArticles: any[] = []
  let from = 0
  const limit = 500
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .range(from, from + limit - 1)
      
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    
    if (data && data.length > 0) {
      allArticles = allArticles.concat(data)
      from += limit
      if (data.length < limit) hasMore = false
    } else {
      hasMore = false
    }
  }

  return NextResponse.json({ articles: allArticles })
}
