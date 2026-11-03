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

async function run() {
  const envNeon = parseEnv(path.join(__dirname, "..", ".env.neon"));
  const envLocal = parseEnv(path.join(__dirname, "..", ".env.local"));
  const envStandard = parseEnv(path.join(__dirname, "..", ".env"));

  const connectionString =
    process.env.DATABASE_URL ||
    envNeon.DATABASE_URL ||
    envLocal.DATABASE_URL ||
    envStandard.DATABASE_URL;

  if (!connectionString) {
    console.error("ERROR: No DATABASE_URL found.");
    process.exit(1);
  }

  console.log("Connecting to Neon PostgreSQL...");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const migrationSql = fs.readFileSync(
      path.join(__dirname, "..", "sql", "migrations", "001_initial_schema.sql"),
      "utf8"
    );

    console.log("Applying migration 001_initial_schema.sql...");
    await client.query(migrationSql);
    console.log("Migration applied successfully!");

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("Verified public tables in Neon database:");
    for (const row of res.rows) {
      console.log(` - ${row.table_name}`);
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
