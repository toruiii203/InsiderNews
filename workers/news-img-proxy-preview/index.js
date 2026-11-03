/**
 * news-img-proxy-preview — Isolated Cloudflare Preview Worker for R2 Media
 * Deploys to an isolated preview hostname (*.workers.dev) without touching img.theinsidernewsph.com.
 *
 * Routing:
 *   GET /images/<filename> -> R2 key: images/<filename>
 *   GET /videos/<filename> -> R2 key: videos/<filename>
 *   GET /<filename>        -> R2 key: images/<filename>
 *
 * Contract:
 *   - Only GET and HEAD methods are permitted.
 *   - All mutations (POST, PUT, DELETE) reject with 405 Method Not Allowed.
 *   - Missing objects return 404 Not Found.
 *   - Existing objects return exact bytes with ETag and immutable caching.
 */

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

    // Default to 'images/' prefix if bucket prefix not specified
    if (!key.startsWith("images/") && !key.startsWith("videos/")) {
      key = `images/${key}`;
    }

    // 2. Fetch object from Cloudflare R2 bucket binding
    const r2 = env.MEDIA_BUCKET || env.R2_BUCKET;
    if (!r2) {
      return new Response("R2 bucket binding not configured in preview environment", { status: 500 });
    }

    const object = await r2.get(key);

    if (!object) {
      return new Response("Object Not Found", {
        status: 404,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 3. Conditional GET support (ETag matching)
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

    // 4. Return exact media with cache headers
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
  },
};
