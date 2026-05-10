export const runtime = "edge"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
}

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? ""
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret")
  if (secret !== ADMIN_SECRET) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const contentType = req.headers.get("content-type") ?? ""
  if (!ALLOWED_TYPES[contentType]) return NextResponse.json({ error: `Unsupported type: ${contentType}` }, { status: 400 })

  const bucket = req.headers.get("x-bucket") ?? "images"
  const filenameHeader = req.headers.get("x-filename") ?? ""
  const isVideo = contentType.startsWith("video/")
  const maxBytes = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024

  const buffer = await req.arrayBuffer()
  if (buffer.byteLength > maxBytes) return NextResponse.json({ error: `File too large.` }, { status: 413 })

  const ext = ALLOWED_TYPES[contentType]
  const filename = filenameHeader || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data, error } = await supabase.storage.from(bucket).upload(filename, buffer, { contentType, upsert: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 })
}
