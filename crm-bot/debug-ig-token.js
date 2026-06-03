require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data } = await admin.from('app_config').select('value').eq('key', 'INSTAGRAM_ACCESS_TOKEN').single();
  const token = data.value;
  console.log('IG Token:', token.slice(0, 12) + '...');
  console.log('Length:', token.length);

  // Try debug_token endpoint to inspect the token
  const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(process.env.SUPABASE_SERVICE_ROLE_KEY)}`;
  console.log('\n=== Calling /debug_token ===');
  const r = await fetch(debugUrl);
  const d = await r.json();
  console.log(JSON.stringify(d, null, 2));

  // Also try fetching me with this token
  console.log('\n=== /me with IG token ===');
  const meR = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${encodeURIComponent(token)}`);
  const meD = await meR.json();
  console.log(JSON.stringify(meD, null, 2));
})();
