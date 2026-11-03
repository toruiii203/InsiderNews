// scripts/import-historical-supabase.js
// Production historical data restoration tool for migrating exported Supabase content into Neon PostgreSQL
// Supports Articles, Videos, and Staff tables with dry-run verification and conflict-safe inserts.

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

function parseExportFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (filePath.endsWith(".csv")) {
    const firstNewline = raw.indexOf("\n");
    if (firstNewline === -1) throw new Error("Invalid CSV format");
    let jsonPart = raw.slice(firstNewline + 1).trim();
    if (jsonPart.startsWith('"') && jsonPart.endsWith('"')) {
      jsonPart = jsonPart.slice(1, -1).replace(/""/g, '"');
    }
    return JSON.parse(jsonPart);
  } else {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length === 1 && parsed[0].json_agg) return parsed[0].json_agg;
      return parsed;
    }
    return parsed.articles || parsed.data || [];
  }
}

async function runImporter() {
  const isApply = process.argv.includes("--apply");

  console.log("===============================================================");
  console.log("   INSIDERNEWS SUPABASE HISTORICAL DATA RESTORATION TOOL");
  console.log(`   Mode: ${isApply ? "APPLY (Writing changes to Neon)" : "DRY-RUN (Simulated — No changes will be written)"}`);
  console.log("===============================================================\n");

  const articlesFile = path.join(__dirname, "..", "supabase-articles-export.csv");
  const videosFile = path.join(__dirname, "..", "supabase-videos-export.csv");
  const staffFile = path.join(__dirname, "..", "supabase-staff-export.csv");

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  // ── 1. IMPORT ARTICLES ────────────────────────────────────────────────────────
  if (fs.existsSync(articlesFile)) {
    console.log("--- Processing Articles ---");
    const rawArticles = parseExportFile(articlesFile);
    console.log(`Loaded ${rawArticles.length} articles from ${path.basename(articlesFile)}.`);

    const { rows: countBefore } = await client.query("SELECT COUNT(*)::int AS count FROM articles;");
    console.log(`Neon Database Articles Before: ${countBefore[0].count}`);

    const { rows: existingRows } = await client.query("SELECT id FROM articles;");
    const existingIds = new Set(existingRows.map(r => r.id));

    const toInsert = [];
    let skipped = 0;

    for (const item of rawArticles) {
      if (!item.id || !item.title) {
        skipped++;
        continue;
      }
      if (existingIds.has(String(item.id))) {
        skipped++;
        continue;
      }

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
    }

    console.log(`Articles to insert: ${toInsert.length} (Skipped/Already existing: ${skipped})`);

    if (isApply && toInsert.length > 0) {
      console.log("Inserting articles in batches of 100...");
      const batchSize = 100;
      let inserted = 0;

      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        for (const rec of batch) {
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
        process.stdout.write(`  Inserted ${inserted}/${toInsert.length} articles...\r`);
      }
      console.log(`\nSuccessfully inserted ${inserted} articles into Neon!`);

      const { rows: countAfter } = await client.query("SELECT COUNT(*)::int AS count FROM articles;");
      console.log(`Neon Database Articles After: ${countAfter[0].count}`);
    }
  }

  // ── 2. IMPORT VIDEOS ──────────────────────────────────────────────────────────
  if (fs.existsSync(videosFile)) {
    console.log("\n--- Processing Videos ---");
    const rawVideos = parseExportFile(videosFile);
    console.log(`Loaded ${rawVideos.length} videos from ${path.basename(videosFile)}.`);

    const { rows: countBefore } = await client.query("SELECT COUNT(*)::int AS count FROM videos;");
    console.log(`Neon Database Videos Before: ${countBefore[0].count}`);

    const { rows: existingRows } = await client.query("SELECT id FROM videos;");
    const existingIds = new Set(existingRows.map(r => r.id));

    const toInsert = rawVideos.filter(v => v.id && v.title && !existingIds.has(String(v.id)));
    console.log(`Videos to insert: ${toInsert.length}`);

    if (isApply && toInsert.length > 0) {
      for (const rec of toInsert) {
        await client.query(
          `INSERT INTO videos (id, title, description, video_url, thumbnail_url, category, published_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING;`,
          [
            String(rec.id),
            String(rec.title),
            rec.description ? String(rec.description) : "",
            String(rec.video_url || ""),
            String(rec.thumbnail_url || ""),
            rec.category ? String(rec.category) : "Nation",
            rec.published_at ? new Date(rec.published_at).toISOString() : new Date().toISOString(),
            rec.created_at ? new Date(rec.created_at).toISOString() : new Date().toISOString(),
          ]
        );
      }
      const { rows: countAfter } = await client.query("SELECT COUNT(*)::int AS count FROM videos;");
      console.log(`Neon Database Videos After: ${countAfter[0].count}`);
    }
  }

  // ── 3. IMPORT STAFF ───────────────────────────────────────────────────────────
  if (fs.existsSync(staffFile)) {
    console.log("\n--- Processing Staff ---");
    const rawStaff = parseExportFile(staffFile);
    console.log(`Loaded ${rawStaff.length} staff records from ${path.basename(staffFile)}.`);

    const { rows: countBefore } = await client.query("SELECT COUNT(*)::int AS count FROM staff;");
    console.log(`Neon Database Staff Before: ${countBefore[0].count}`);

    const { rows: existingRows } = await client.query("SELECT id FROM staff;");
    const existingIds = new Set(existingRows.map(r => r.id));

    const toInsert = rawStaff.filter(s => s.id && s.name && !existingIds.has(String(s.id)));
    console.log(`Staff to insert: ${toInsert.length}`);

    if (isApply && toInsert.length > 0) {
      for (const rec of toInsert) {
        await client.query(
          `INSERT INTO staff (id, name, role, bio, photo_url, email, display_order, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING;`,
          [
            String(rec.id),
            String(rec.name),
            rec.role ? String(rec.role) : "Reporter",
            rec.bio ? String(rec.bio) : "",
            rec.photo_url ? String(rec.photo_url) : "",
            rec.email ? String(rec.email) : "",
            typeof rec.display_order === "number" ? rec.display_order : 0,
            rec.created_at ? new Date(rec.created_at).toISOString() : new Date().toISOString(),
          ]
        );
      }
      const { rows: countAfter } = await client.query("SELECT COUNT(*)::int AS count FROM staff;");
      console.log(`Neon Database Staff After: ${countAfter[0].count}`);
    }
  }

  console.log("\n===============================================================");
  if (!isApply) {
    console.log("   DRY RUN COMPLETE — Zero records were written to the database.");
    console.log("   To perform the actual migration, re-run with --apply:");
    console.log("   node scripts/import-historical-supabase.js --apply");
  } else {
    console.log("   MIGRATION COMPLETE — All historical records successfully imported!");
  }
  console.log("===============================================================\n");

  await client.end();
}

runImporter().catch(err => {
  console.error("Importer failed:", err);
  process.exit(1);
});
