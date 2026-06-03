require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async () => {
  // Count conversations by platform
  const { data, error } = await admin.from('conversations').select('platform, status');
  if (error) { console.log('Error:', error.message); return; }
  console.log('Total conversations:', data.length);
  const byPlatform = {};
  data.forEach(c => { byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1; });
  console.log('By platform:', byPlatform);

  // Test INSERT as anon to see if RLS blocks writes
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  console.log('\n=== Testing anon INSERT into conversations ===');
  const { data: iData, error: iErr } = await anon.from('conversations').insert({
    customer_id: '00000000-0000-0000-0000-000000000000',
    platform: 'instagram',
    status: 'open',
    messages: '[]',
  }).select().single();
  if (iErr) {
    console.log('  RLS BLOCKS anon INSERT:', iErr.message);
    console.log('  Hint:', iErr.hint);
  } else {
    console.log('  Anon CAN insert:', iData.id);
    await admin.from('conversations').delete().eq('id', iData.id);
  }
})();
