export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("staff")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from("staff")
    .insert({
      name: body.name,
      role: body.role,
      bio: body.bio ?? "",
      photo_url: body.photo_url ?? "",
      email: body.email ?? "",
      display_order: body.display_order ?? 0,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabaseAdmin
    .from("staff")
    .update(updates)
    .eq("id", id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ staff: data })
}

export async function DELETE(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabaseAdmin.from("staff").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
