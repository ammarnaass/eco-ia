// Try using service_role key as database password
require('dotenv').config();
const { Client } = require('pg');

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function tryConn(host, port, user) {
  const connStr = `postgresql://${user}:${serviceKey}@${host}:${port}/postgres`;
  console.log('Trying:', connStr.replace(serviceKey, '****'));
  const client = new Client({ connectionString: connStr });
  try {
    await client.connect();
    const r = await client.query('SELECT 1 as ok');
    console.log('✓ Connected!', r.rows);
    await client.end();
    return true;
  } catch (e) {
    console.log('✗', e.message);
    return false;
  }
}

(async () => {
  console.log('Project:', projectRef);
  console.log('Service key:', serviceKey.slice(0, 15) + '...');
  console.log('');

  // Try various connection options
  const options = [
    { host: `db.${projectRef}.supabase.co`, port: 5432, user: 'postgres' },
    { host: `db.${projectRef}.supabase.co`, port: 6543, user: 'postgres' },
    { host: `aws-0-us-east-1.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}` },
  ];

  for (const opt of options) {
    const ok = await tryConn(opt.host, opt.port, opt.user);
    if (ok) break;
  }
})();
