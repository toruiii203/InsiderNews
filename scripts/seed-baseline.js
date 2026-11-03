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
    console.error("No DATABASE_URL found.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const { rows: articleRows } = await client.query("SELECT COUNT(*) AS count FROM articles;");
    const articleCount = parseInt(articleRows[0].count, 10);
    console.log(`Current article count in Neon: ${articleCount}`);

    if (articleCount === 0 && process.env.SEED_TEST_FIXTURES === "true") {
      console.log("Seeding baseline test articles from lib/mock-data.ts...");
      const mockArticles = [
        {
          id: '1',
          title: 'Senate Probe Reveals Undisclosed Offshore Accounts in Bangsamoro Deal',
          content: '<p>Senators demand answers as documents surface linking officials to foreign transactions totaling ₱2.3 billion. The Senate blue ribbon committee has launched a full investigation after whistleblowers submitted sworn statements alongside financial records.</p><p>Key witnesses testified that transactions bypassed standard central bank oversight protocols, prompting calls for stricter regulatory enforcement across autonomous regional expenditures.</p>',
          excerpt: 'Senators demand answers as documents surface linking officials to foreign transactions totaling ₱2.3 billion.',
          category: 'Nation',
          author: 'Maria Santos',
          published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          image_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
          language: 'EN',
          is_breaking: true,
          view_count: 15420,
          reading_time: 5,
          tags: ['senate', 'bangsamoro', 'investigation'],
          status: 'published'
        },
        {
          id: '2',
          title: 'President Signs ₱6.3T National Budget into Law Amid Calls for Transparency',
          content: '<p>Civil society groups urge immediate publication of full budget line items, citing recent audit findings. The signing ceremony at Malacañang was attended by cabinet members and select lawmakers from both chambers.</p><p>Economic managers emphasize infrastructure development, digital modernization, and social welfare programs as key drivers for this fiscal cycle.</p>',
          excerpt: 'Civil society groups urge immediate publication of full budget line items following the historic signing.',
          category: 'Nation',
          author: 'Juan dela Cruz',
          published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          image_url: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=800&q=80',
          language: 'EN',
          is_breaking: true,
          view_count: 8932,
          reading_time: 4,
          tags: ['budget', 'government', 'transparency'],
          status: 'published'
        },
        {
          id: '3',
          title: 'Typhoon Signal No. 2 Raised Over Eastern Visayas as Storm Approaches',
          content: '<p>PAGASA has raised Typhoon Warning Signal No. 2 over Eastern Visayas provinces as the tropical storm is expected to make landfall within 24 hours. Residents are urged to evacuate low-lying areas immediately.</p><p>Disaster response teams have been pre-positioned across Samar and Leyte with relief goods and rescue equipment on standby.</p>',
          excerpt: 'PAGASA warns of strong winds and heavy rains as tropical storm is expected to make landfall.',
          category: 'Regions',
          author: 'Paolo Reyes',
          published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          image_url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80',
          language: 'EN',
          is_breaking: true,
          view_count: 45230,
          reading_time: 3,
          tags: ['typhoon', 'visayas', 'pagasa'],
          status: 'published'
        },
        {
          id: '4',
          title: 'MMDA Launches New Anti-Flooding System for Metro Manila',
          content: '<p>The Metropolitan Manila Development Authority unveiled a ₱800 million smart drainage system that uses AI sensors to predict and prevent flooding in 12 critical areas across the metropolis.</p>',
          excerpt: 'Smart drainage system using AI sensors to prevent flooding in 12 critical metro areas.',
          category: 'Metro',
          author: 'Ana Reyes',
          published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          image_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
          language: 'EN',
          is_breaking: false,
          view_count: 7621,
          reading_time: 4,
          tags: ['mmda', 'flooding', 'metro manila'],
          status: 'published'
        },
        {
          id: '5',
          title: 'BSP Keeps Benchmark Interest Rate Steady at 6.25% Amid Inflation Watch',
          content: '<p>The Bangko Sentral ng Pilipinas monetary board opted to keep key rates unchanged, balancing domestic growth momentum with lingering risks to commodity prices.</p>',
          excerpt: 'Central bank maintains policy stance as inflation indicators show stabilizing trajectory.',
          category: 'Business',
          author: 'Carlos Mendoza',
          published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
          language: 'EN',
          is_breaking: false,
          view_count: 5310,
          reading_time: 3,
          tags: ['bsp', 'economy', 'interest rates'],
          status: 'published'
        }
      ];

      for (const a of mockArticles) {
        await client.query(`
          INSERT INTO articles (id, title, excerpt, content, category, author, published_at, image_url, language, is_breaking, view_count, reading_time, tags, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            excerpt = EXCLUDED.excerpt;
        `, [a.id, a.title, a.excerpt, a.content, a.category, a.author, a.published_at, a.image_url, a.language, a.is_breaking, a.view_count, a.reading_time, a.tags, a.status]);
      }
      console.log(`Seeded ${mockArticles.length} baseline articles.`);
    }

    // Seed mock videos if empty
    const { rows: videoRows } = await client.query("SELECT COUNT(*) AS count FROM videos;");
    const videoCount = parseInt(videoRows[0].count, 10);
    if (videoCount === 0) {
      console.log("Seeding baseline videos...");
      const mockVideos = [
        {
          id: 'v1',
          title: 'President Signs Historic Climate Action Bill',
          description: 'Full coverage of the ceremonial signing at Malacañang Palace.',
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          thumbnail_url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
          category: 'Nation',
          published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'v2',
          title: 'Typhoon Update: Live Coverage from Eastern Visayas',
          description: 'Real-time updates as the typhoon approaches the eastern coastline.',
          video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          thumbnail_url: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800&q=80',
          category: 'Regions',
          published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        }
      ];

      for (const v of mockVideos) {
        await client.query(`
          INSERT INTO videos (id, title, description, video_url, thumbnail_url, category, published_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING;
        `, [v.id, v.title, v.description, v.video_url, v.thumbnail_url, v.category, v.published_at]);
      }
      console.log(`Seeded ${mockVideos.length} baseline videos.`);
    }

    // Seed mock poll if empty
    const { rows: pollRows } = await client.query("SELECT COUNT(*) AS count FROM polls;");
    const pollCount = parseInt(pollRows[0].count, 10);
    if (pollCount === 0) {
      console.log("Seeding initial active poll...");
      await client.query(`
        INSERT INTO polls (id, question, options, active)
        VALUES (
          'poll-1',
          'Do you support the proposed expansion of the PUV Modernization Program?',
          $1::jsonb,
          true
        )
        ON CONFLICT (id) DO NOTHING;
      `, [JSON.stringify([
        { id: 'opt1', text: 'Yes, fully support' },
        { id: 'opt2', text: 'Yes, but with financial subsidies for drivers' },
        { id: 'opt3', text: 'No, halt implementation' },
        { id: 'opt4', text: 'Undecided' }
      ])]);
      console.log("Seeded initial poll.");
    }

    // Seed staff members if empty
    const { rows: staffRows } = await client.query("SELECT COUNT(*) AS count FROM staff;");
    const staffCount = parseInt(staffRows[0].count, 10);
    if (staffCount === 0) {
      console.log("Seeding baseline staff...");
      const staffMembers = [
        { name: "Maria Santos", role: "Editor-in-Chief", bio: "Award-winning investigative journalist covering national politics.", email: "editor@theinsidernewsph.com", display_order: 1 },
        { name: "Juan dela Cruz", role: "Managing Editor", bio: "Over 15 years reporting on government affairs and public policy.", email: "managing@theinsidernewsph.com", display_order: 2 },
        { name: "Paolo Reyes", role: "Senior Regional Correspondent", bio: "Focusing on Visayas and Mindanao socio-economic developments.", email: "regions@theinsidernewsph.com", display_order: 3 }
      ];
      for (const s of staffMembers) {
        await client.query(`
          INSERT INTO staff (name, role, bio, email, display_order)
          VALUES ($1, $2, $3, $4, $5);
        `, [s.name, s.role, s.bio, s.email, s.display_order]);
      }
      console.log("Seeded baseline staff.");
    }

    console.log("Database initialization and baseline seeding complete!");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
