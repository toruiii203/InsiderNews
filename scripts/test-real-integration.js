// scripts/test-real-integration.js
// Genuine end-to-end integration test suite exercising real HTTP requests, Neon database, and session auth

const fs = require("fs");
const path = require("path");
const { Client } = require("@neondatabase/serverless");

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envLocal = parseEnv(path.join(__dirname, "..", ".env.local"));
const envNeon = parseEnv(path.join(__dirname, "..", ".env.neon"));

const DATABASE_URL = process.env.DATABASE_URL || envLocal.DATABASE_URL || envNeon.DATABASE_URL;
const ADMIN_SECRET = process.env.ADMIN_SECRET || envLocal.ADMIN_SECRET || envNeon.ADMIN_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || envLocal.ADMIN_USERNAME || envNeon.ADMIN_USERNAME || "admin";
const JWT_SECRET = process.env.JWT_SECRET || envLocal.JWT_SECRET || envNeon.JWT_SECRET;
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3009";

if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set.");
  process.exit(1);
}
if (!ADMIN_SECRET) {
  console.error("FATAL: ADMIN_SECRET is not set.");
  process.exit(1);
}

async function runTests() {
  console.log("===============================================================");
  console.log("   INSIDERNEWS LIVE HTTP & DATABASE INTEGRATION TEST SUITE");
  console.log("   Target URL: " + BASE_URL);
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // --- 1. NEON DIRECT CONNECTION & LATENCY BENCHMARK ---
  console.log("--- 1. Live Neon Latency & Connection Check ---");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const latencies = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await client.query("SELECT 1 AS ping;");
    latencies.push(performance.now() - t0);
  }
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  console.log(`   Neon Latencies: ${latencies.map(l => l.toFixed(1) + "ms").join(", ")}`);
  console.log(`   Average: ${avgLatency.toFixed(1)}ms | p95: ${p95.toFixed(1)}ms`);
  assert(avgLatency < 200, `Neon average query latency (${avgLatency.toFixed(1)}ms) well under 200ms threshold`);

  // --- 2. REAL HTTP AUTHENTICATION & SESSION LIFECYCLE ---
  console.log("\n--- 2. Real HTTP Authentication & Session Lifecycle ---");

  // 2a. Rejection of unsupported username
  const badUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "unsupported_user", secret: ADMIN_SECRET }),
  });
  assert(badUserRes.status === 401, `Unsupported username correctly rejected with HTTP 401 (${badUserRes.status})`);

  // 2b. Rejection of invalid password
  const badPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, secret: "incorrect_secret" }),
  });
  assert(badPassRes.status === 401, `Invalid password correctly rejected with HTTP 401 (${badPassRes.status})`);

  // 2c. Successful login with authoritative server credentials
  const tLoginStart = performance.now();
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, secret: ADMIN_SECRET }),
  });
  const loginDuration = performance.now() - tLoginStart;
  assert(loginRes.status === 200, `Authoritative login succeeded with HTTP 200 in ${loginDuration.toFixed(1)}ms`);

  // Extract set-cookie header
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const cookieMatch = setCookie.match(/admin_session=([^;]+)/);
  const sessionToken = cookieMatch ? cookieMatch[1] : "";
  assert(Boolean(sessionToken), `Server returned secure signed admin_session cookie (${sessionToken.slice(0, 15)}...)`);
  assert(setCookie.toLowerCase().includes("httponly"), "admin_session cookie has HttpOnly flag set");
  assert(setCookie.toLowerCase().includes("samesite=strict"), "admin_session cookie has SameSite=Strict flag set");

  const sessionCookieHeader = `admin_session=${sessionToken}`;

  // --- 3. REAL HTTP AUTHORIZATION POLICIES ---
  console.log("\n--- 3. Real HTTP Authorization Policy Enforcement ---");

  // 3a. Unauthenticated GET /api/articles?status=draft -> 401
  const unauthDraftRes = await fetch(`${BASE_URL}/api/articles?status=draft`);
  assert(unauthDraftRes.status === 401, `Unauthenticated ?status=draft correctly returns HTTP 401 (${unauthDraftRes.status})`);

  // 3b. Authenticated GET /api/articles?status=draft -> 200
  const authDraftRes = await fetch(`${BASE_URL}/api/articles?status=draft`, {
    headers: { Cookie: sessionCookieHeader },
  });
  assert(authDraftRes.status === 200, `Authenticated ?status=draft successfully returns HTTP 200 (${authDraftRes.status})`);

  // 3c. Unauthenticated POST /api/articles -> 401
  const unauthCreateRes = await fetch(`${BASE_URL}/api/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Unauthorized Attempt", category: "Nation", author: "Hacker" }),
  });
  assert(unauthCreateRes.status === 401, `Unauthenticated article creation correctly returns HTTP 401 (${unauthCreateRes.status})`);

  // 3d. Expired or tampered session token -> 401
  const tamperedRes = await fetch(`${BASE_URL}/api/articles?status=draft`, {
    headers: { Cookie: "admin_session=invalid.tampered.token" },
  });
  assert(tamperedRes.status === 401, `Tampered/invalid session cookie correctly rejected with HTTP 401 (${tamperedRes.status})`);

  // --- 4. REAL EDITORIAL PUBLISHING & RETRIEVAL CYCLE ---
  console.log("\n--- 4. Real Editorial Publishing Lifecycle in Neon ---");
  const testArticleTitle = `Operational Verification Story ${Date.now()}`;

  // 4a. Authenticated article creation (as draft)
  const tCreate = performance.now();
  const createRes = await fetch(`${BASE_URL}/api/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookieHeader,
    },
    body: JSON.stringify({
      title: testArticleTitle,
      excerpt: "Automated test excerpt for editorial pipeline.",
      content: "<p>This is genuine automated verification content.</p>",
      category: "Nation",
      author: "Quality Assurance",
      status: "draft",
      is_breaking: false,
      published_at: new Date().toISOString(),
    }),
  });
  const createDuration = performance.now() - tCreate;
  assert(createRes.status === 201, `Authenticated article creation returned HTTP 201 Created in ${createDuration.toFixed(1)}ms`);

  const createData = await createRes.json();
  const createdArticleId = createData.article?.id;
  assert(Boolean(createdArticleId), `Created article assigned valid ID: ${createdArticleId}`);

  // 4b. Confirm draft is NOT visible in public news feed
  const publicFeedRes1 = await fetch(`${BASE_URL}/api/articles`);
  const publicData1 = await publicFeedRes1.json();
  const inPublicFeed1 = (publicData1.articles || []).some(a => a.id === createdArticleId);
  assert(!inPublicFeed1, "New draft is NOT visible in public published news feed");

  // 4c. Update article to published
  const tPublish = performance.now();
  const publishRes = await fetch(`${BASE_URL}/api/articles`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookieHeader,
    },
    body: JSON.stringify({
      id: createdArticleId,
      status: "published",
      title: `${testArticleTitle} [Published]`,
    }),
  });
  const publishDuration = performance.now() - tPublish;
  assert(publishRes.status === 200, `Article transitioned to published status in ${publishDuration.toFixed(1)}ms (HTTP ${publishRes.status})`);

  // 4d. Confirm published article IS now visible in public news feed
  const publicFeedRes2 = await fetch(`${BASE_URL}/api/articles`);
  const publicData2 = await publicFeedRes2.json();
  const inPublicFeed2 = (publicData2.articles || []).some(a => a.id === createdArticleId);
  assert(inPublicFeed2, "Published article is immediately visible in public news feed");

  // 4e. Revert article to draft and verify public access is removed
  const revertRes = await fetch(`${BASE_URL}/api/articles`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookieHeader,
    },
    body: JSON.stringify({
      id: createdArticleId,
      status: "draft",
    }),
  });
  assert(revertRes.status === 200, "Article reverted back to draft (HTTP 200)");

  const publicFeedRes3 = await fetch(`${BASE_URL}/api/articles`);
  const publicData3 = await publicFeedRes3.json();
  const inPublicFeed3 = (publicData3.articles || []).some(a => a.id === createdArticleId);
  assert(!inPublicFeed3, "Reverted draft is immediately removed from public news feed");

  // 4f. Delete test article and clean up Neon
  const deleteRes = await fetch(`${BASE_URL}/api/articles`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookieHeader,
    },
    body: JSON.stringify({ id: createdArticleId }),
  });
  assert(deleteRes.status === 200, "Test article cleanly deleted from Neon (HTTP 200)");

  const { rows: verifyDeleted } = await client.query("SELECT id FROM articles WHERE id = $1", [createdArticleId]);
  assert(verifyDeleted.length === 0, "Verified test article completely removed from Neon database");

  // --- 5. LOGOUT & SESSION TERMINATION ---
  console.log("\n--- 5. Session Logout & Expiration ---");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: sessionCookieHeader },
  });
  assert(logoutRes.status === 200, `POST /api/auth/logout succeeded with HTTP 200 (${logoutRes.status})`);
  const logoutSetCookie = (logoutRes.headers.get("set-cookie") || "").toLowerCase();
  assert(
    logoutSetCookie.includes("max-age=0") || logoutSetCookie.includes("expires="),
    "Logout invalidated the admin_session cookie"
  );

  // --- 6. R2 STORAGE SAFE ERROR HANDLING & BEHAVIOR ---
  console.log("\n--- 6. Cloudflare R2 Storage Safe Behavior ---");
  const uploadUnauthRes = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    headers: {
      "x-filename": "test.jpg",
      "x-bucket": "images",
      "Content-Type": "image/jpeg",
    },
    body: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  });
  assert(uploadUnauthRes.status === 401, `Unauthenticated media upload rejected with HTTP 401 (${uploadUnauthRes.status})`);

  // Authenticated upload test with unconfigured preview credentials -> must return safe 500 error, never a fake URL
  const uploadAuthRes = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    headers: {
      "x-filename": "test-failure-check.jpg",
      "x-bucket": "images",
      "Content-Type": "image/jpeg",
      Cookie: sessionCookieHeader,
    },
    body: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  });
  const uploadAuthData = await uploadAuthRes.json().catch(() => ({}));
  assert(
    uploadAuthRes.status === 500 && uploadAuthData.error && uploadAuthData.error.includes("R2 storage unavailable"),
    `Unconfigured R2 correctly fails safely with HTTP 500 and descriptive error without fake URLs`
  );

  // --- 7. WORKER PROXY UNIT VALIDATION ---
  console.log("\n--- 7. R2 Worker Routing & Status Contract ---");
  // Test worker code directly
  const workerModule = require("../workers/news-img-proxy/index.js").default;
  
  // Test 7a: 405 on mutations
  const postReq = new Request("https://img.theinsidernewsph.com/images/test.jpg", { method: "POST" });
  const postRes = await workerModule.fetch(postReq, {}, {});
  assert(postRes.status === 405, `Worker rejects POST with 405 Method Not Allowed (${postRes.status})`);

  // Test 7b: 404 on missing object
  const mockR2Empty = {
    get: async () => null,
  };
  const getReq = new Request("https://img.theinsidernewsph.com/images/non-existent.jpg", { method: "GET" });
  const get404Res = await workerModule.fetch(getReq, { MEDIA_BUCKET: mockR2Empty }, {});
  assert(get404Res.status === 404, `Worker returns 404 for missing R2 objects (${get404Res.status})`);

  // Test 7c: 200 on existing object
  const mockR2Found = {
    get: async (key) => ({
      httpEtag: '"test-etag-123"',
      writeHttpMetadata: (headers) => { headers.set("content-type", "image/jpeg"); },
      body: new Uint8Array([1, 2, 3]),
    }),
  };
  const get200Res = await workerModule.fetch(getReq, { MEDIA_BUCKET: mockR2Found }, {});
  assert(get200Res.status === 200, `Worker returns 200 for found R2 objects with cache headers (${get200Res.status})`);
  assert(get200Res.headers.get("cache-control")?.includes("immutable"), "Worker attaches immutable cache-control header");

  await client.end();

  console.log("\n===============================================================");
  console.log(`   INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
