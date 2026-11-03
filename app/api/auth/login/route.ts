export const runtime = "edge"

import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/session"

// In-memory fallback rate limiting map: IP -> { attempts, resetAt }
const memoryRateLimit = new Map<string, { attempts: number; resetAt: number }>()

async function checkRateLimit(ip: string): Promise<boolean> {
  const kv = (process.env as any).AUTH_KV ?? (globalThis as any).AUTH_KV
  const key = `ratelimit:login:${ip}`
  const now = Date.now()

  // 1. If Cloudflare KV is bound, use distributed key-value store
  if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
    try {
      const current = await kv.get(key)
      const attempts = current ? parseInt(current, 10) : 0
      if (attempts >= 5) return false
      return true
    } catch {
      // Fallback to in-memory on KV error
    }
  }

  // 2. In-memory edge fallback
  const record = memoryRateLimit.get(ip)
  if (record && record.resetAt > now) {
    if (record.attempts >= 5) return false
  } else {
    memoryRateLimit.set(ip, { attempts: 0, resetAt: now + 5 * 60 * 1000 })
  }
  return true
}

async function recordFailedAttempt(ip: string): Promise<void> {
  const kv = (process.env as any).AUTH_KV ?? (globalThis as any).AUTH_KV
  const key = `ratelimit:login:${ip}`

  if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
    try {
      const current = await kv.get(key)
      const attempts = current ? parseInt(current, 10) : 0
      await kv.put(key, (attempts + 1).toString(), { expirationTtl: 300 })
      return
    } catch {}
  }

  const record = memoryRateLimit.get(ip)
  if (record) {
    record.attempts += 1
  }
}

async function clearRateLimit(ip: string): Promise<void> {
  const kv = (process.env as any).AUTH_KV ?? (globalThis as any).AUTH_KV
  const key = `ratelimit:login:${ip}`

  if (kv && typeof kv.delete === "function") {
    try {
      await kv.delete(key)
    } catch {}
  }
  memoryRateLimit.delete(ip)
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown"

  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many failed login attempts. Please wait 5 minutes." },
      { status: 429 }
    )
  }

  const { secret } = await req.json().catch(() => ({ secret: "" }))
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret || secret !== adminSecret) {
    await recordFailedAttempt(ip)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Reset rate limiting on successful login
  await clearRateLimit(ip)
  await createSession("admin")
  
  return NextResponse.json({ success: true }, { status: 200 })
}
