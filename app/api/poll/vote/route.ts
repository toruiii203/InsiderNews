// app/api/poll/vote/route.ts
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const runtime = "edge"



export async function POST(req: NextRequest) {
  try {
    const { pollId, optionId } = await req.json()

    if (!pollId || !optionId) {
      return NextResponse.json({ error: "pollId and optionId are required" }, { status: 400 })
    }

    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      option_id: optionId,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
