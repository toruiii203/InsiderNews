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

async function verify() {
  const envNeon = parseEnv(path.join(__dirname, "..", ".env.neon"));
  const connectionString = process.env.DATABASE_URL || envNeon.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  console.log("Neon Database Table Counts:");
  const tables = [
    "articles",
    "videos",
    "staff",
    "about_content",
    "polls",
    "subscribers",
    "article_views",
    "poll_votes",
  ];

  for (const table of tables) {
    const { rows } = await client.query(`SELECT count(*) AS count FROM ${table};`);
    console.log(` - ${table}: ${rows[0].count} rows`);
  }

  await client.end();
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
