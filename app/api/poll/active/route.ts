import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "edge"

export async function GET() {
  try {
    const polls = await db.query(
      `SELECT id, question, options FROM polls WHERE active = true ORDER BY created_at DESC LIMIT 1`
    )

    if (!polls || polls.length === 0) {
      return NextResponse.json({ poll: null })
    }

    const poll = polls[0]
    const options = typeof poll.options === "string" ? JSON.parse(poll.options) : poll.options

    const votes = await db.query(
      `SELECT option_id, COUNT(*)::int as count FROM poll_votes WHERE poll_id = $1 GROUP BY option_id`,
      [poll.id]
    )

    const counts: Record<string, number> = {}
    let totalVotes = 0
    for (const v of votes ?? []) {
      const c = Number(v.count)
      counts[v.option_id] = c
      totalVotes += c
    }

    return NextResponse.json({
      poll: {
        id: poll.id,
        question: poll.question,
        options,
        counts,
        totalVotes,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
