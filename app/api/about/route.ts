export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("about_content")
    .select("*")
    .eq("id", 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ about: data })
}

export async function PATCH(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from("about_content")
    .update({
      heading: body.heading,
      mission: body.mission,
      story: body.story,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ about: data })
}
