import { getDatabaseUrl } from './_env.mjs';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Connecting to Supabase PostgreSQL at aws-0-eu-west-1.pooler.supabase.com:5432...');
  
  const client = new Client({ connectionString: getDatabaseUrl(), ssl: { rejectUnauthorized: false },
    query_timeout: 60000 });

  await client.connect();
  console.log('Connected successfully!');

  const sqlFile = path.resolve('supabase', 'deploy_schema.sql');
  console.log(`Reading ${sqlFile}...`);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Executing database schema deployment (this may take 15-30 seconds)...');
  const startTime = Date.now();
  
  try {
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Schema deployed successfully in ${duration}s!`);
  } catch (err) {
    console.error('Error during SQL execution:');
    console.error('Message:', err.message);
    console.error('Position:', err.position);
    console.error('Detail:', err.detail);
    console.error('Hint:', err.hint);
    console.error('Where:', err.where);
    await client.end();
    process.exit(1);
  }

  // Verification queries
  console.log('\n--- VERIFICATION ---');
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`Total public tables created: ${tablesRes.rows.length}`);
  console.log('Tables:', tablesRes.rows.map(r => r.table_name).join(', '));

  const categoriesRes = await client.query(`
    SELECT id, name, slug 
    FROM public.service_categories 
    ORDER BY display_order;
  `);
  console.log(`\nSeeded service categories: ${categoriesRes.rows.length}`);
  for (const c of categoriesRes.rows) {
    console.log(` - [${c.slug}] ${c.name}`);
  }

  const settingsRes = await client.query(`
    SELECT key, value 
    FROM public.platform_settings;
  `);
  console.log(`\nPlatform settings count: ${settingsRes.rows.length}`);

  await client.end();
  console.log('\nDatabase setup complete and verified!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
