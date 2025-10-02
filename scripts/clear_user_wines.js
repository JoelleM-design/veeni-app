/*
  Clear all wines and history for ONE user only.
  - Deletes rows from user_wine (both cellar and wishlist)
  - Deletes rows from wine_history (tasted, stock_change, etc.)
  - Does NOT delete global wine records or touch other users

  Usage examples:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/clear_user_wines.js --email user@example.com
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/clear_user_wines.js --user-id 00000000-0000-0000-0000-000000000000

  Safety:
    - Requires SERVICE ROLE key to allow deletions
    - Filters strictly by user_id so other users are never affected
*/

const { createClient } = require('@supabase/supabase-js');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email') { args.email = argv[++i]; }
    else if (a === '--user-id') { args.userId = argv[++i]; }
    else if (a === '--dry-run') { args.dryRun = true; }
  }
  return args;
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }

  const args = parseArgs(process.argv);
  if (!args.email && !args.userId) {
    console.error('Provide --email or --user-id');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let userId = args.userId || null;
  if (!userId && args.email) {
    const { data, error } = await supabase
      .from('User')
      .select('id, email')
      .ilike('email', args.email)
      .maybeSingle();
    if (error || !data) {
      console.error('User not found for email:', args.email, error || '');
      process.exit(1);
    }
    userId = data.id;
    console.log('Resolved userId from email:', data.email, '->', userId);
  }

  // Count rows before deletion
  async function countRows(table) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count || 0;
  }

  try {
    const uwCount = await countRows('user_wine');
    const whCount = await countRows('wine_history');
    console.log(`About to delete for user_id=${userId}: user_wine=${uwCount}, wine_history=${whCount}`);

    if (args.dryRun) {
      console.log('Dry run enabled. No deletions performed.');
      process.exit(0);
    }

    // Delete history first (FK safety if any)
    const delHistory = await supabase
      .from('wine_history')
      .delete()
      .eq('user_id', userId);
    if (delHistory.error) throw delHistory.error;
    console.log('Deleted wine_history rows');

    // Delete cellar + wishlist links
    const delUserWine = await supabase
      .from('user_wine')
      .delete()
      .eq('user_id', userId);
    if (delUserWine.error) throw delUserWine.error;
    console.log('Deleted user_wine rows');

    console.log('Cleanup complete for user:', userId);
  } catch (e) {
    console.error('Error during cleanup:', e);
    process.exit(1);
  }
}

main();










