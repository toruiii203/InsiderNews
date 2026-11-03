export const runtime = "edge"

import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/session"

// In-memory rate limiting map for edge runtime: IP -> { attempts, lastAttempt }
const loginAttempts = new Map<string, { attempts: number; resetAt: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown"
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (record && record.resetAt > now) {
    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed login attempts. Please wait 5 minutes." },
        { status: 429 }
      )
    }
  } else {
    loginAttempts.set(ip, { attempts: 0, resetAt: now + 5 * 60 * 1000 })
  }

  const { secret } = await req.json().catch(() => ({ secret: "" }))
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret || secret !== adminSecret) {
    const current = loginAttempts.get(ip)
    if (current) current.attempts += 1
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Reset rate limiting on successful login
  loginAttempts.delete(ip)
  await createSession("admin")
  
  return NextResponse.json({ success: true }, { status: 200 })
}
