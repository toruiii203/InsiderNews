// scripts/import-historical-supabase.js
// Dedicated historical data restoration tool for migrating exported Supabase articles into Neon PostgreSQL
// Usage:
//   Dry-run mode (default, non-destructive):
//     node scripts/import-historical-supabase.js --file ./path/to/supabase_articles.json
//   Apply mode (performs validated database inserts):
//     node scripts/import-historical-supabase.js --file ./path/to/supabase_articles.json --apply

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

if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set.");
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
let filePath = null;
let isDryRun = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--file" && args[i + 1]) {
    filePath = args[i + 1];
    i++;
  } else if (args[i] === "--apply") {
    isDryRun = false;
  } else if (args[i] === "--dry-run") {
    isDryRun = true;
  }
}

async function runImporter() {
  console.log("===============================================================");
  console.log("   INSIDERNEWS SUPABASE HISTORICAL DATA RESTORATION TOOL");
  console.log(`   Mode: ${isDryRun ? "DRY-RUN (Simulated — No changes will be written)" : "APPLY (Writing changes to Neon)"}`);
  console.log("===============================================================\n");

  if (!filePath) {
    console.log("No input file specified via --file <path>.");
    console.log("Checking for default export file at: ./supabase-articles-export.json");
    const defaultPath = path.join(__dirname, "..", "supabase-articles-export.json");
    if (fs.existsSync(defaultPath)) {
      filePath = defaultPath;
    } else {
      console.log("\n[INFO] No export file found. Tool is installed and ready for when historical export is retrieved.");
      console.log("Expected input formats:");
      console.log("  1. Array of article objects: [ { id, title, content, published_at, ... }, ... ]");
      console.log("  2. Object wrapper: { articles: [ ... ] } or Supabase SQL output: [ { json_agg: [ ... ] } ]\n");
      process.exit(0);
    }
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`FATAL: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  let rawContent;
  try {
    rawContent = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  } catch (err) {
    console.error(`FATAL: Failed to parse JSON in ${resolvedPath}:`, err.message);
    process.exit(1);
  }

  // Handle various export wrappers
  let articles = [];
  if (Array.isArray(rawContent)) {
    if (rawContent.length === 1 && rawContent[0].json_agg) {
      articles = rawContent[0].json_agg;
    } else {
      articles = rawContent;
    }
  } else if (rawContent && Array.isArray(rawContent.articles)) {
    articles = rawContent.articles;
  } else if (rawContent && Array.isArray(rawContent.data)) {
    articles = rawContent.data;
  } else {
    console.error("FATAL: Unrecognized export format. Expected JSON array of article rows.");
    process.exit(1);
  }

  console.log(`Loaded ${articles.length} records from ${path.basename(resolvedPath)}.\n`);

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Query baseline count
  const { rows: countBefore } = await client.query("SELECT COUNT(*)::int AS count FROM articles;");
  const beforeCount = countBefore[0].count;
  console.log(`Neon Database Row Count Before Import: ${beforeCount}`);

  // Query existing IDs to check conflicts
  const { rows: existingRows } = await client.query("SELECT id, created_at, status FROM articles;");
  const existingIdMap = new Map(existingRows.map(r => [r.id, r]));

  let validCount = 0;
  let conflictCount = 0;
  let invalidCount = 0;
  const toInsert = [];

  for (const item of articles) {
    if (!item.id || !item.title) {
      console.warn(`[SKIP] Missing required id or title on record:`, item);
      invalidCount++;
      continue;
    }

    if (existingIdMap.has(item.id)) {
      conflictCount++;
      continue;
    }

    // Preserve exact original data
    toInsert.push({
      id: String(item.id),
      title: String(item.title),
      excerpt: item.excerpt ? String(item.excerpt) : "",
      content: item.content ? String(item.content) : "",
      category: item.category ? String(item.category) : "Nation",
      author: item.author ? String(item.author) : "Staff Reporter",
      image_url: item.image_url ? String(item.image_url) : "",
      published_at: item.published_at ? new Date(item.published_at).toISOString() : new Date().toISOString(),
      is_breaking: Boolean(item.is_breaking),
      language: item.language ? String(item.language) : "EN",
      tags: Array.isArray(item.tags) ? item.tags : [],
      reading_time: typeof item.reading_time === "number" ? item.reading_time : 3,
      status: item.status || "published",
      view_count: typeof item.view_count === "number" ? item.view_count : 0,
      created_at: item.created_at ? new Date(item.created_at).toISOString() : new Date().toISOString(),
    });
    validCount++;
  }

  console.log("\nPre-Import Analysis:");
  console.log(`  Total Exported Rows:        ${articles.length}`);
  console.log(`  Valid New Rows to Import:   ${validCount}`);
  console.log(`  Conflicting / Already in DB: ${conflictCount} (Preserved; will not be overwritten)`);
  console.log(`  Invalid / Missing Fields:   ${invalidCount}`);

  if (isDryRun) {
    console.log("\n[DRY RUN COMPLETE] No records were modified.");
    console.log("To execute the import, run the command with --apply:");
    console.log(`  node scripts/import-historical-supabase.js --file "${filePath}" --apply`);
    await client.end();
    return;
  }

  // APPLY MODE
  console.log("\nExecuting validated batch insert into Neon...");
  let inserted = 0;
  for (const rec of toInsert) {
    await client.query(
      `INSERT INTO articles (
        id, title, excerpt, content, category, author, image_url,
        published_at, is_breaking, language, tags, reading_time, status, view_count, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO NOTHING;`,
      [
        rec.id, rec.title, rec.excerpt, rec.content, rec.category, rec.author,
        rec.image_url, rec.published_at, rec.is_breaking, rec.language,
        rec.tags, rec.reading_time, rec.status, rec.view_count, rec.created_at,
      ]
    );
    inserted++;
  }

  const { rows: countAfter } = await client.query("SELECT COUNT(*)::int AS count FROM articles;");
  const afterCount = countAfter[0].count;

  console.log("\n===============================================================");
  console.log("   IMPORT EXECUTION SUMMARY");
  console.log("===============================================================");
  console.log(`   Articles in Neon Before: ${beforeCount}`);
  console.log(`   Successfully Inserted:  ${inserted}`);
  console.log(`   Articles in Neon After:  ${afterCount}`);
  console.log("===============================================================\n");

  await client.end();
}

runImporter().catch(err => {
  console.error("Importer failed:", err);
  process.exit(1);
});
