export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 })
    }
    const normalised = email.toLowerCase().trim()

    const { error } = await supabaseAdmin
      .from("subscribers")
      .insert({ email: normalised, confirmed: false })

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, message: "Subscribed successfully!" }, { status: 201 })
  } catch (err) {
    console.error("[Subscribe] Error:", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    count: data.length,
    subscribers: data.map(s => ({
      email: s.email,
      subscribedAt: s.created_at,
      confirmed: s.confirmed,
    })),
  })
}

export async function DELETE(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }
  const { email } = await req.json()
  const { error } = await supabaseAdmin.from("subscribers").delete().eq("email", email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
