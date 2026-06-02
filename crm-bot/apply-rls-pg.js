/**
 * apply-rls-pg.js — Apply RLS via direct pg connection
 *
 * Usage:
 *   1. Get DB password from Supabase Dashboard → Project Settings → Database
 *   2. Add SUPABASE_DB_PASSWORD to crm-bot/.env
 *   3. Run: node apply-rls-pg.js
 *
 * Connection string format (from Supabase):
 *   postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword) {
    console.log('');
    console.log('═'.repeat(60));
    console.log('  Missing SUPABASE_DB_PASSWORD in crm-bot/.env');
    console.log('═'.repeat(60));
    console.log('');
    console.log('To get it:');
    console.log('  1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
    console.log('  2. Scroll to "Connection string" → "Transaction" pooler');
    console.log('  3. Copy the password from the URI');
    console.log('  4. Add to crm-bot/.env:');
    console.log('     SUPABASE_DB_PASSWORD=your-password-here');
    console.log('  5. Re-run: node apply-rls-pg.js');
    console.log('');
    console.log('Or apply manually:');
    console.log('  → https://supabase.com/dashboard/sql');
    console.log('  → Paste: crm-bot/db/enable-rls-for-frontend.sql');
    return;
  }

  // Build connection string (Transaction pooler — port 6543, IPv4 friendly)
  const connStr = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

  console.log('═'.repeat(60));
  console.log('  Applying RLS Policies — eco-ia CRM');
  console.log('═'.repeat(60));
  console.log('');
  console.log('Project:', projectRef);
  console.log('Connecting to transaction pooler...');

  const client = new Client({ connectionString: connStr });

  try {
    await client.connect();
    console.log('✓ Connected!\n');
  } catch (e) {
    console.log('✗ Connection failed:', e.message);
    console.log('');
    console.log('Make sure:');
    console.log('  - The password is correct');
    console.log('  - You are using the "Transaction" pooler (port 6543)');
    console.log('  - Your IP is not blocked by Supabase');
    return;
  }

  // Read and split SQL
  const sqlFile = path.join(__dirname, 'db', 'enable-rls-for-frontend.sql');
  const fullSql = fs.readFileSync(sqlFile, 'utf8');

  // Better SQL splitter that handles $$, comments, etc.
  const statements = fullSql
    .split(/;\s*(?:\n|$)/)
    .map(s => s.trim())
    .filter(s => {
      const noComments = s.split('\n')
        .filter(l => !l.trim().startsWith('--'))
        .join('\n').trim();
      return noComments.length > 0;
    });

  console.log(`Executing ${statements.length} SQL statements...\n`);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstLine = stmt.split('\n').find(l => l.trim() && !l.trim().startsWith('--')) || '';
    const preview = firstLine.slice(0, 60);
    try {
      await client.query(stmt);
      success++;
      console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`);
    } catch (e) {
      failed++;
      console.log(`✗ [${i + 1}/${statements.length}] ${preview}...`);
      console.log(`   Error: ${e.message.split('\n')[0]}`);
    }
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log(`  Results: ${success} OK, ${failed} failed`);
  console.log('═'.repeat(60));

  await client.end();

  if (failed === 0) {
    console.log('\n✅ All policies applied! Testing ANON access...\n');

    const { createClient } = require('@supabase/supabase-js');
    const anonClient = createClient(projectUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

    const { data, error } = await anonClient.from('products').select('id, name_ar').order('id');
    if (error) {
      console.log('✗ ANON verification FAILED:', error.message);
    } else {
      console.log(`✓ ANON can now read ${data.length} products: ${data.map(p => p.id).join(', ')}`);
      console.log('\n🎉 The frontend should now display all products!');
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
