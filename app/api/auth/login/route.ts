export const runtime = "edge"

import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/session"

export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  const adminSecret = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET

  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  await createSession("admin")
  
  return NextResponse.json({ success: true }, { status: 200 })
}
