export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { query } from "@/lib/db"

// Admin endpoint - returns ALL articles including scheduled and drafts
export async function GET(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const articles = await query(
      "SELECT * FROM articles ORDER BY published_at DESC;"
    )

    return NextResponse.json({ articles })
  } catch (err: any) {
    console.error("[API Articles All] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
