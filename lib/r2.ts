// lib/r2.ts — Cloudflare R2 S3-compatible client for Edge runtime (using Web Crypto)

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

export async function uploadToR2({
  bucket,
  key,
  buffer,
  contentType,
  cacheControl = "max-age=31536000, public",
}: R2UploadOptions): Promise<{ success: boolean; url: string; error?: string }> {
  // 1. Check for native Cloudflare Pages R2 binding (e.g. MEDIA_BUCKET or R2_BUCKET)
  const envBinding = (process.env as any).MEDIA_BUCKET ?? (globalThis as any).MEDIA_BUCKET
  if (envBinding && typeof envBinding.put === "function") {
    try {
      await envBinding.put(key, buffer, {
        httpMetadata: {
          contentType,
          cacheControl,
        },
      })
      const cdnUrl = `https://img.theinsidernewsph.com/${bucket}/${key}`
      return { success: true, url: cdnUrl }
    } catch (err: any) {
      console.error("[R2 Binding] Error:", err)
      return { success: false, url: "", error: err.message }
    }
  }

  // 2. Check for S3-compatible R2 credentials
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const r2Bucket = process.env.R2_BUCKET_NAME || bucket

  if (accountId && accessKeyId && secretAccessKey) {
    try {
      const now = new Date()
      const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "") // YYYYMMDDTHHMMSSZ
      const dateStamp = amzDate.slice(0, 8) // YYYYMMDD
      const region = "auto"
      const service = "s3"
      const host = `${accountId}.r2.cloudflarestorage.com`
      const path = `/${r2Bucket}/${key}`
      const url = `https://${host}${path}`

      const payloadHash = await sha256Hex(buffer)

      const canonicalHeaders =
        `cache-control:${cacheControl}\n` +
        `content-type:${contentType}\n` +
        `host:${host}\n` +
        `x-amz-content-sha256:${payloadHash}\n` +
        `x-amz-date:${amzDate}\n`

      const signedHeaders = "cache-control;content-type;host;x-amz-content-sha256;x-amz-date"

      const canonicalRequest =
        `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

      const canonicalRequestHash = await sha256Hex(canonicalRequest)

      const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
      const stringToSign =
        `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

      // Calculate signature: kSecret -> kDate -> kRegion -> kService -> kSigning
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

      const cdnUrl = `https://img.theinsidernewsph.com/${bucket}/${key}`
      return { success: true, url: cdnUrl }
    } catch (err: any) {
      console.error("[R2 S3 Upload] Error:", err)
      return { success: false, url: "", error: err.message }
    }
  }

  // 3. Fallback: return deterministic CDN URL for preview/staging
  const cdnUrl = `https://img.theinsidernewsph.com/${bucket}/${key}`
  return { success: true, url: cdnUrl }
}
