/*
  Clear all wine memories from the database
  - Deletes all rows from wine_memory_likes
  - Deletes all rows from wine_memories
  - Use with caution - this deletes ALL memories for ALL users

  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/clear_wine_memories.js
*/

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🧹 Starting wine memories cleanup...');

    // Count existing records
    const { count: likesCount } = await supabase
      .from('wine_memory_likes')
      .select('*', { count: 'exact', head: true });

    const { count: memoriesCount } = await supabase
      .from('wine_memories')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Found ${memoriesCount} memories and ${likesCount} likes`);

    if (memoriesCount === 0) {
      console.log('✅ No memories to delete');
      return;
    }

    // Delete likes first (foreign key constraint)
    console.log('🗑️ Deleting wine memory likes...');
    const { error: likesError } = await supabase
      .from('wine_memory_likes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (likesError) {
      throw likesError;
    }
    console.log('✅ Deleted wine memory likes');

    // Delete memories
    console.log('🗑️ Deleting wine memories...');
    const { error: memoriesError } = await supabase
      .from('wine_memories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (memoriesError) {
      throw memoriesError;
    }
    console.log('✅ Deleted wine memories');

    console.log('🎉 Wine memories cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

main();






