/**
 * apply-rls-with-pg.js — Apply RLS policies using direct PostgreSQL connection
 *
 * Uses the pg client to connect directly to Supabase's PostgreSQL.
 * Needs the connection string from Supabase Dashboard → Project Settings → Database.
 *
 * For automation, we can use the Supabase CLI to get the connection string.
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  // Standard Supabase connection format:
  // postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  // The password is your database password (set when you created the project)

  // Try to get connection string from env
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  const dbConnectionString = process.env.SUPABASE_DB_URL;

  let client;
  if (dbConnectionString) {
    console.log('Using SUPABASE_DB_URL...');
    client = new Client({ connectionString: dbConnectionString });
  } else if (dbPassword) {
    const connStr = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
    console.log('Using password from env, connecting to:', connStr.replace(dbPassword, '****'));
    client = new Client({ connectionString: connStr });
  } else {
    console.log('');
    console.log('═'.repeat(60));
    console.log('  ⚠️  Cannot auto-apply without DB password');
    console.log('═'.repeat(60));
    console.log('');
    console.log('To enable auto-apply, add to crm-bot/.env:');
    console.log('');
    console.log('  SUPABASE_DB_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]');
    console.log('                @aws-0-us-east-1.pooler.supabase.com:6543/postgres');
    console.log('');
    console.log('Get the connection string from:');
    console.log('  Supabase Dashboard → Project Settings → Database → Connection string');
    console.log('  → Transaction pooler (port 6543)');
    console.log('');
    console.log('Or apply manually:');
    console.log('  1. Go to: https://supabase.com/dashboard/sql');
    console.log('  2. Paste the contents of: crm-bot/db/enable-rls-for-frontend.sql');
    console.log('  3. Click Run');
    return;
  }

  console.log('Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('✓ Connected!');

  // Read the SQL file
  const sqlFile = path.join(__dirname, 'db', 'enable-rls-for-frontend.sql');
  const fullSql = fs.readFileSync(sqlFile, 'utf8');

  // Split by semicolons (simple approach — may not handle functions with semicolons inside)
  const statements = fullSql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 5);

  console.log(`\nExecuting ${statements.length} SQL statements...`);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    // Skip pure comments
    const firstNonComment = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--'));
    if (!firstNonComment) continue;

    try {
      await client.query(stmt);
      success++;
      console.log(`✓ [${i + 1}] OK`);
    } catch (e) {
      failed++;
      console.log(`✗ [${i + 1}] FAILED: ${e.message.split('\n')[0]}`);
    }
  }

  console.log(`\nResults: ${success} OK, ${failed} failed`);
  await client.end();

  if (failed === 0) {
    console.log('\n✅ All policies applied! Verifying...');

    // Test ANON access
    const { createClient } = require('@supabase/supabase-js');
    const anonClient = createClient(projectUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await anonClient.from('products').select('id, name_ar').order('id');
    if (error) {
      console.log('✗ Verification FAILED:', error.message);
    } else {
      console.log(`✓ ANON can now read ${data.length} products`);
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
