export const runtime = "edge"

import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/session"
import { getRuntimeEnv } from "@/lib/env"

// In-memory fallback rate limiting map for local dev / unconfigured KV: IP -> { attempts, resetAt }
const memoryRateLimit = new Map<string, { attempts: number; resetAt: number }>()

/**
 * Resolve Cloudflare KV binding for distributed rate limiting across Edge PoPs.
 */
async function getAuthKv(): Promise<any | null> {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages")
    const ctx = getRequestContext()
    if (ctx?.env) {
      const binding = (ctx.env as any).AUTH_KV ?? (ctx.env as any).KV
      if (binding && typeof binding.get === "function" && typeof binding.put === "function") {
        return binding
      }
    }
  } catch {
    // getRequestContext() is only available inside active Cloudflare Pages requests
  }

  const globalBinding = (process.env as any).AUTH_KV ?? (globalThis as any).AUTH_KV
  if (globalBinding && typeof globalBinding.get === "function" && typeof globalBinding.put === "function") {
    return globalBinding
  }

  return null
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const kv = await getAuthKv()
  const key = `ratelimit:login:${ip}`
  const now = Date.now()

  // 1. If Cloudflare KV is bound, use distributed key-value store
  if (kv) {
    try {
      const current = await kv.get(key)
      const attempts = current ? parseInt(current, 10) : 0
      if (attempts >= 5) return false
      return true
    } catch {
      // Fallback to in-memory on KV transient error
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
  const kv = await getAuthKv()
  const key = `ratelimit:login:${ip}`

  if (kv) {
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
  const kv = await getAuthKv()
  const key = `ratelimit:login:${ip}`

  if (kv) {
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

  const body = await req.json().catch(() => ({}))
  const { username, secret } = body

  const adminSecret = getRuntimeEnv("ADMIN_SECRET")
  const authoritativeUsername = (getRuntimeEnv("ADMIN_USERNAME") || "admin").trim().toLowerCase()
  const submittedUsername = (username || "").trim().toLowerCase()

  // Enforce authoritative server administrator identity:
  // Both username and password must match the authoritative server credentials
  if (
    !adminSecret ||
    !secret ||
    secret !== adminSecret ||
    !submittedUsername ||
    submittedUsername !== authoritativeUsername
  ) {
    await recordFailedAttempt(ip)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  // Reset rate limiting on successful login
  await clearRateLimit(ip)
  await createSession("admin-primary")
  
  return NextResponse.json({ success: true, username: authoritativeUsername }, { status: 200 })
}
