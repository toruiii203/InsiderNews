const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

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

async function test() {
  const env = parseEnv(path.join(__dirname, "..", ".env.neon"));
  const url = process.env.DATABASE_URL || env.DATABASE_URL;
  const sql = neon(url);

  console.log("Testing neon(url) with parameterized query...");
  const rows = await sql.query("SELECT id, title, category FROM articles WHERE status = $1 LIMIT $2", [
    "published",
    2,
  ]);
  console.log("Success! Returned rows count:", rows.length);
  console.log("Row 0:", rows[0]);
}

test().catch(console.error);
