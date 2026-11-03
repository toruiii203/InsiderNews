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

async function isolate() {
  const envNeon = parseEnv(path.join(__dirname, "..", ".env.neon"));
  const connectionString = process.env.DATABASE_URL || envNeon.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Isolating test fixtures in Neon database...");
  const res = await client.query(`
    UPDATE articles 
    SET status = 'test_fixture' 
    WHERE id IN ('1', '2', '3', '4', '5');
  `);
  console.log(`Updated ${res.rowCount} test articles to status = 'test_fixture'.`);

  const { rows: published } = await client.query("SELECT count(*) as count FROM articles WHERE status = 'published';");
  const { rows: fixtures } = await client.query("SELECT count(*) as count FROM articles WHERE status = 'test_fixture';");
  console.log(`Published real articles count: ${published[0].count}`);
  console.log(`Isolated test fixtures count: ${fixtures[0].count}`);

  await client.end();
}

isolate().catch(console.error);
