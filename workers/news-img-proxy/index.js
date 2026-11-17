/**
 * news-img-proxy — Cloudflare Worker for serving InsiderNews media directly from Cloudflare R2,
 * with automatic fallback to Supabase Storage + write-through cache to R2 on cache miss.
 * Domain: img.theinsidernewsph.com
 */

const SUPABASE_ORIGIN = "https://dyamlsfldhjpimdlixfc.supabase.co/storage/v1/object/public";

export default {
  async fetch(request, env, ctx) {
    // 1. Method restriction — read-only
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          Allow: "GET, HEAD",
          "Cache-Control": "no-store",
        },
      });
    }

    const url = new URL(request.url);
    let key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    if (!key || key === "favicon.ico") {
      return new Response("Not Found", { status: 404 });
    }

    // Default to 'images/' prefix if not explicitly specified
    if (!key.startsWith("images/") && !key.startsWith("videos/")) {
      key = `images/${key}`;
    }

    const r2 = env.MEDIA_BUCKET || env.R2_BUCKET;

    // 2. Try to fetch from Cloudflare R2
    if (r2) {
      try {
        const object = await r2.get(key);
        if (object) {
          const ifNoneMatch = request.headers.get("if-none-match");
          if (ifNoneMatch && ifNoneMatch === object.httpEtag) {
            return new Response(null, {
              status: 304,
              headers: {
                ETag: object.httpEtag,
                "Cache-Control": "public, max-age=2592000, immutable",
              },
            });
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("ETag", object.httpEtag);
          headers.set("Cache-Control", "public, max-age=2592000, immutable");
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("X-Content-Type-Options", "nosniff");

          if (request.method === "HEAD") {
            return new Response(null, { headers });
          }

          return new Response(object.body, { headers });
        }
      } catch (err) {
        console.error("R2 fetch error:", err);
      }
    }

    // 3. Cache miss on R2: Fallback to Supabase Storage
    const supabaseUrl = `${SUPABASE_ORIGIN}/${key}`;
    const upstreamRes = await fetch(supabaseUrl, {
      headers: {
        "User-Agent": "InsiderNews-ImgProxy/1.0",
      },
    });

    if (!upstreamRes.ok) {
      return new Response("Object Not Found", {
        status: 404,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/jpeg";
    const bodyBuffer = await upstreamRes.arrayBuffer();

    // 4. Write-through to R2 in background so subsequent requests hit R2 directly!
    if (r2) {
      ctx.waitUntil(
        r2.put(key, bodyBuffer, {
          httpMetadata: {
            contentType,
            cacheControl: "max-age=31536000, public",
          },
        }).catch((e) => console.error("R2 background put error:", e))
      );
    }

    // 5. Return to client with long-lived edge cache
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", "public, max-age=2592000, immutable");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("X-Content-Type-Options", "nosniff");

    if (request.method === "HEAD") {
      return new Response(null, { headers: responseHeaders });
    }

    return new Response(bodyBuffer, { headers: responseHeaders });
  },
};
