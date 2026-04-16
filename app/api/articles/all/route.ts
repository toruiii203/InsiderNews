import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Admin endpoint - returns ALL articles including scheduled
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  const { data, error } = await supabaseAdmin
    .from("articles").select("*").order("published_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data ?? [] })
}
