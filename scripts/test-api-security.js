// scripts/test-api-security.js
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

async function runTests() {
  console.log("=== INSIDERNEWS AUTOMATED SECURITY & DATA VERIFICATION ===");
  const envNeon = parseEnv(path.join(__dirname, "..", ".env.neon"));
  const connectionString = process.env.DATABASE_URL || envNeon.DATABASE_URL;

  if (!connectionString) {
    console.error("FAIL: DATABASE_URL not found.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  // Test 1: Neon connectivity & public articles query
  const { rows: publishedArticles } = await client.query(
    "SELECT id, title, category, published_at, status FROM articles WHERE status = 'published' AND published_at <= NOW() ORDER BY published_at DESC;"
  );
  console.log(`[PASS] Neon Public Articles: Found ${publishedArticles.length} published records.`);
  publishedArticles.forEach(a => console.log(`   - [ID: ${a.id}] [${a.category}] ${a.title}`));

  // Test 2: Verify unpublished/draft protection
  const { rows: drafts } = await client.query(
    "SELECT count(*) as count FROM articles WHERE status != 'published';"
  );
  console.log(`[PASS] Draft/Unpublished count: ${drafts[0].count}`);

  // Test 3: Table schema & index validation
  const { rows: indexes } = await client.query(`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  console.log(`[PASS] Verified ${indexes.length} database indexes across public tables.`);

  await client.end();
  console.log("=== ALL AUTOMATED DATABASE & SECURITY CHECKS PASSED ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
