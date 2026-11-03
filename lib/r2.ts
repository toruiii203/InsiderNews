// lib/r2.ts — Cloudflare R2 client for Edge runtime (Cloudflare Pages Binding & S3 API)

interface R2UploadOptions {
  bucket: string
  key: string
  buffer: ArrayBuffer
  contentType: string
  cacheControl?: string
}

async function hmacSha256(key: Uint8Array | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  return await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data))
}

async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data
  const hash = await crypto.subtle.digest("SHA-256", buf)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Resolve Cloudflare Pages R2 bucket binding.
 * Tries @cloudflare/next-on-pages getRequestContext(), then process.env / globalThis bindings.
 */
async function getR2Binding(): Promise<any | null> {
  // 1. Check direct Cloudflare request context via global symbol
  try {
    const symbol = Symbol.for("__cloudflare-request-context__")
    const cfContext = (globalThis as any)[symbol]
    if (cfContext?.env) {
      const binding = cfContext.env.MEDIA_BUCKET ?? cfContext.env.R2_BUCKET
      if (binding && typeof binding.put === "function") {
        return binding
      }
    }
  } catch {}

  // 2. Try @cloudflare/next-on-pages dynamic import
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages")
    const ctx = getRequestContext()
    if (ctx?.env) {
      const binding = (ctx.env as any).MEDIA_BUCKET ?? (ctx.env as any).R2_BUCKET
      if (binding && typeof binding.put === "function") {
        return binding
      }
    }
  } catch {
    // getRequestContext() is only available inside active Cloudflare Pages request
  }

  const globalBinding = (process.env as any).MEDIA_BUCKET ?? (globalThis as any).MEDIA_BUCKET ?? (process.env as any).R2_BUCKET ?? (globalThis as any).R2_BUCKET
  if (globalBinding && typeof globalBinding.put === "function") {
    return globalBinding
  }

  return null
}

export async function uploadToR2({
  bucket,
  key,
  buffer,
  contentType,
  cacheControl = "max-age=31536000, public",
}: R2UploadOptions): Promise<{ success: boolean; url: string; error?: string }> {
  // Ensure the object key has the bucket prefix for unified routing: images/<filename> or videos/<filename>
  const fullKey = key.startsWith(`${bucket}/`) ? key : `${bucket}/${key}`

  // 1. Try native Cloudflare Pages R2 binding (fastest & native)
  const r2Binding = await getR2Binding()
  if (r2Binding) {
    try {
      await r2Binding.put(fullKey, buffer, {
        httpMetadata: {
          contentType,
          cacheControl,
        },
      })
      const cdnUrl = `https://img.theinsidernewsph.com/${fullKey}`
      return { success: true, url: cdnUrl }
    } catch (err: any) {
      console.error("[R2 Binding Upload Error]:", err)
      return { success: false, url: "", error: `Cloudflare R2 binding upload failed: ${err.message}` }
    }
  }

  // 2. Try S3-compatible R2 credentials (works in any Edge or Node environment)
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const r2BucketName = process.env.R2_BUCKET_NAME || "insidernews-media"

  if (accountId && accessKeyId && secretAccessKey) {
    try {
      const now = new Date()
      const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "") // YYYYMMDDTHHMMSSZ
      const dateStamp = amzDate.slice(0, 8)
      const region = "auto"
      const service = "s3"
      const host = `${accountId}.r2.cloudflarestorage.com`
      const path = `/${r2BucketName}/${fullKey}`
      const url = `https://${host}${path}`

      const payloadHash = await sha256Hex(buffer)

      const canonicalHeaders =
        `cache-control:${cacheControl}\n` +
        `content-type:${contentType}\n` +
        `host:${host}\n` +
        `x-amz-content-sha256:${payloadHash}\n` +
        `x-amz-date:${amzDate}\n`

      const signedHeaders = "cache-control;content-type;host;x-amz-content-sha256;x-amz-date"
      const canonicalRequest = `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
      const canonicalRequestHash = await sha256Hex(canonicalRequest)

      const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
      const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

      const kDate = await hmacSha256(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp)
      const kRegion = await hmacSha256(kDate, region)
      const kService = await hmacSha256(kRegion, service)
      const kSigning = await hmacSha256(kService, "aws4_request")
      const signature = toHex(await hmacSha256(kSigning, stringToSign))

      const authHeader =
        `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
          "Host": host,
          "x-amz-date": amzDate,
          "x-amz-content-sha256": payloadHash,
          "Authorization": authHeader,
        },
        body: buffer,
      })

      if (!res.ok) {
        const text = await res.text()
        return { success: false, url: "", error: `R2 S3 error (${res.status}): ${text}` }
      }

      const cdnUrl = `https://img.theinsidernewsph.com/${fullKey}`
      return { success: true, url: cdnUrl }
    } catch (err: any) {
      console.error("[R2 S3 Upload Error]:", err)
      return { success: false, url: "", error: `R2 S3 upload failed: ${err.message}` }
    }
  }

  // 3. No fallback — fail safely with informative error
  return {
    success: false,
    url: "",
    error: "R2 storage unavailable: neither Cloudflare R2 binding (MEDIA_BUCKET) nor R2 S3 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are configured.",
  }
}
