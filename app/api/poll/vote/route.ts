import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { pollId, optionId } = await req.json()

    if (!pollId || !optionId) {
      return NextResponse.json({ error: "pollId and optionId are required" }, { status: 400 })
    }

    await db.query(
      `INSERT INTO poll_votes (poll_id, option_id) VALUES ($1, $2)`,
      [pollId, optionId]
    )

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid request" }, { status: 500 })
  }
}
