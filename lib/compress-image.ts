export interface CompressImageResult {
  blob: Blob | File
  contentType: string
  filename: string
}

/**
 * Compresses an image file on the client side:
 * - Downscales so the longest side is at most 1600px.
 * - Re-encodes as WebP at quality 0.82.
 * - Skips non-images and GIFs.
 * - If compression fails or the result is larger than the original, returns the original.
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<CompressImageResult> {
  const originalResult: CompressImageResult = {
    blob: file,
    contentType: file.type,
    filename: file.name,
  }

  // Do not touch videos, non-images, or GIFs
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return originalResult
  }

  if (typeof window === "undefined") {
    return originalResult
  }

  try {
    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(file)
    } catch {
      return originalResult
    }

    const { width, height } = bitmap
    let targetWidth = width
    let targetHeight = height

    if (width > maxDimension || height > maxDimension) {
      if (width >= height) {
        targetWidth = maxDimension
        targetHeight = Math.round((height * maxDimension) / width)
      } else {
        targetHeight = maxDimension
        targetWidth = Math.round((width * maxDimension) / height)
      }
    }

    let webpBlob: Blob | null = null

    // Try OffscreenCanvas if supported
    if (typeof OffscreenCanvas !== "undefined") {
      try {
        const canvas = new OffscreenCanvas(targetWidth, targetHeight)
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
          webpBlob = await canvas.convertToBlob({ type: "image/webp", quality })
        }
      } catch {
        webpBlob = null
      }
    }

    // Fallback to HTMLCanvasElement if OffscreenCanvas didn't produce a blob
    if (!webpBlob && typeof document !== "undefined") {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
          webpBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), "image/webp", quality)
          })
        }
      } catch {
        webpBlob = null
      }
    }

    if (typeof bitmap.close === "function") {
      bitmap.close()
    }

    // If compression failed or resulting size is not smaller than original, keep original
    if (!webpBlob || webpBlob.size >= file.size) {
      return originalResult
    }

    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "") || "image"
    const newFilename = `${nameWithoutExt}.webp`

    return {
      blob: webpBlob,
      contentType: "image/webp",
      filename: newFilename,
    }
  } catch (err) {
    console.warn("Client-side image compression failed, using original file:", err)
    return originalResult
  }
}
