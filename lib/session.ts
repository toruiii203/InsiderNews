import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"

const getKey = () => {
  const secretKey = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "fallback_secret_for_development"
  return new TextEncoder().encode(secretKey)
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getKey())
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, getKey(), { algorithms: ["HS256"] })
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
