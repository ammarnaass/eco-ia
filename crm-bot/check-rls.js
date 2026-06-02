require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  // Try direct SQL via rpc (Supabase has exec_sql function sometimes)
  // Or query pg_policies table directly
  const { data, error } = await adminClient
    .from('pg_policies')
    .select('schemaname, tablename, policyname, roles, cmd')
    .in('tablename', ['products', 'orders', 'conversations', 'customers']);

  if (error) {
    console.log('Cannot read pg_policies directly:', error.message);
    console.log('The user may not have permissions. Need to use Supabase Dashboard SQL Editor instead.');
  } else {
    console.log('=== Current RLS Policies ===');
    console.log(JSON.stringify(data, null, 2));
  }

  // Check products count
  const { count } = await adminClient
    .from('products')
    .select('*', { count: 'exact', head: true });
  console.log('\n=== Products total in DB ===');
  console.log('Count:', count);
})();
