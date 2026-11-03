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

async function inspectSchema() {
  const envNeon = parseEnv(path.join(__dirname, "..", ".env.neon"));
  const connectionString = process.env.DATABASE_URL || envNeon.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();

  const { rows } = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  const tables = {};
  for (const r of rows) {
    if (!tables[r.table_name]) tables[r.table_name] = [];
    tables[r.table_name].push(`${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`);
  }

  console.log("ACTUAL NEON SCHEMA COLUMNS:");
  for (const [tbl, cols] of Object.entries(tables)) {
    console.log(`\nTable: ${tbl}`);
    cols.forEach(c => console.log(`  - ${c}`));
  }

  await client.end();
}

inspectSchema().catch(console.error);
