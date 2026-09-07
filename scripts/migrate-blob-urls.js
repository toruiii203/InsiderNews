require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
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
    .select('id, title, published_at, view_count, image_url')
    .like('image_url', 'blob:%')
    .order('view_count', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }

  console.log(`\nFound ${data.length} affected articles with blob: URLs.\n`);
  
  console.log('--- Affected Articles ---');
  data.forEach((article, index) => {
    console.log(`${index + 1}. [${article.id}] ${article.title}`);
    console.log(`   Published: ${new Date(article.published_at).toLocaleString()}, Views: ${article.view_count}`);
  });
  console.log('-------------------------\n');

  if (isDryRun) {
    console.log('DRY RUN COMPLETE. No changes were made to the database.');
    console.log('Run without --dry-run to apply the changes.');
    return;
  }

  console.log('Applying changes... Setting image_url to "" for all affected articles.');

  for (const article of data) {
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
