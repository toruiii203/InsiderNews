export const runtime = "edge"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { uploadToR2 } from "@/lib/r2"

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
}

export async function POST(req: NextRequest) {
  if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const contentType = req.headers.get("content-type") ?? ""
  if (!ALLOWED_TYPES[contentType]) return NextResponse.json({ error: `Unsupported type: ${contentType}` }, { status: 400 })

  const bucket = req.headers.get("x-bucket") ?? "images"
  const filenameHeader = req.headers.get("x-filename") ?? ""
  const isVideo = contentType.startsWith("video/")
  // Video limit: 200 MB (YouTube/Facebook links are preferred to save storage and egress)
  const maxBytes = isVideo ? 200 * 1024 * 1024 : 5 * 1024 * 1024

  const buffer = await req.arrayBuffer()
  if (buffer.byteLength > maxBytes) return NextResponse.json({ error: `File too large.` }, { status: 413 })

  const ext = ALLOWED_TYPES[contentType]
  const filename = filenameHeader || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const result = await uploadToR2({
    bucket,
    key: filename,
    buffer,
    contentType,
    cacheControl: "max-age=31536000, public",
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error || "Upload failed" }, { status: 500 })
  }

  return NextResponse.json({ url: result.url }, { status: 201 })
}
