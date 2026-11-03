export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { db } from "@/lib/db"

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

    try {
      await db.query(
        `INSERT INTO subscribers (email, confirmed) VALUES ($1, $2)`,
        [normalised, false]
      )
    } catch (dbErr: any) {
      if (dbErr.code === "23505" || dbErr.message?.includes("unique")) {
        return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 })
      }
      throw dbErr
    }

    return NextResponse.json({ success: true, message: "Subscribed successfully!" }, { status: 201 })
  } catch (err) {
    console.error("[Subscribe] Error:", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  try {
    const rows = await db.query(
      `SELECT * FROM subscribers ORDER BY created_at DESC`
    )

    return NextResponse.json({
      count: rows.length,
      subscribers: rows.map((s: any) => ({
        email: s.email,
        subscribedAt: s.created_at,
        confirmed: s.confirmed,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  try {
    const { email } = await req.json()
    await db.query(`DELETE FROM subscribers WHERE email = $1`, [email])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
