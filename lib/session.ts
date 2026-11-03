import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { getRuntimeEnv } from "@/lib/env"

/**
 * Resolve the cryptographic JWT signing key.
 * In production, JWT_SECRET is strictly required to prevent secret reuse or weak defaults.
 * In development/test, derives from ADMIN_SECRET or uses a local test secret.
 */
async function getJwtKey(): Promise<Uint8Array> {
  const explicitSecret = getRuntimeEnv("JWT_SECRET") || getRuntimeEnv("SESSION_SECRET")

  if (explicitSecret) {
    if (explicitSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long for production security")
    }
    return new TextEncoder().encode(explicitSecret)
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL SECURITY CONFIGURATION: JWT_SECRET environment variable is strictly required in production and must not be derived from ADMIN_SECRET."
    )
  }

  // Non-production fallback (local dev / automated tests only)
  const adminSecret = getRuntimeEnv("ADMIN_SECRET")
  if (adminSecret) {
    const namespaced = `INSIDERNEWS_DEV_ONLY_JWT:${adminSecret}`
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(namespaced))
    return new Uint8Array(hash)
  }

  return new TextEncoder().encode("local_dev_test_secret_32_characters_minimum_key!!")
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
