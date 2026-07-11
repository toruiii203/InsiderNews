// app/api/poll/active/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, question, options")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pollError) {
    return NextResponse.json({ error: pollError.message }, { status: 500 })
  }
  if (!poll) {
    return NextResponse.json({ poll: null })
  }

  const { data: votes, error: votesError } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", poll.id)

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 })
  }

  const counts: Record<string, number> = {}
  for (const v of votes ?? []) {
    counts[v.option_id] = (counts[v.option_id] || 0) + 1
  }

  return NextResponse.json({
    poll: {
      id: poll.id,
      question: poll.question,
      options: poll.options,
      counts,
      totalVotes: votes?.length ?? 0,
    },
  })
}
