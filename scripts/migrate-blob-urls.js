// scripts/migrate-blob-urls.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('Finding articles with blob: image URLs...');
  
  const { data, error } = await supabase
    .from('articles')
    .select('id, image_url')
    .like('image_url', 'blob:%');

  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }

  console.log(`Found ${data.length} articles with blob: URLs.`);

  for (const article of data) {
    console.log(`Clearing image_url for article ${article.id}...`);
    const { error: updateError } = await supabase
      .from('articles')
      .update({ image_url: '' })
      .eq('id', article.id);

    if (updateError) {
      console.error(`Failed to update article ${article.id}:`, updateError);
    }
  }

  console.log('Migration complete.');
}

main().catch(console.error);
