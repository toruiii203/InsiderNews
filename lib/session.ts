import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"

/**
 * Get or derive a dedicated JWT signing key separate from the administrative password.
 * Prioritizes JWT_SECRET or SESSION_SECRET from environment.
 * If only ADMIN_SECRET is provided, derives a distinct 256-bit key via SHA-256 hashing
 * with an application-specific namespace so the raw login password is never the JWT key.
 */
async function getJwtKey(): Promise<Uint8Array> {
  const explicitSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET

  if (explicitSecret) {
    return new TextEncoder().encode(explicitSecret)
  }

  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret) {
    // Derive a distinct 256-bit key using Web Crypto SHA-256
    const namespaced = `INSIDERNEWS_JWT_SESSION_V1:${adminSecret}`
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(namespaced))
    return new Uint8Array(hash)
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SECRET or JWT_SECRET environment variable is missing in production")
  }

  return new TextEncoder().encode("local_dev_secret_only_never_use_in_production")
}

export async function encrypt(payload: any) {
  const key = await getJwtKey()
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const key = await getJwtKey()
  const { payload } = await jwtVerify(input, key, { algorithms: ["HS256"] })
  return payload
}

export async function createSession(adminId: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session = await encrypt({ adminId, expires })
  const cookieStore = await cookies()
  
  cookieStore.set("admin_session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  })
}

export async function verifySession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get("admin_session")?.value
  if (!cookie) return null
  
  try {
    const payload = await decrypt(cookie)
    if (!payload) return null
    return payload
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
}
