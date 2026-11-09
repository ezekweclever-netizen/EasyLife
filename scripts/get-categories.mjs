import { getDatabaseUrl } from './_env.mjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function checkCategories() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const res = await client.query('SELECT id, name, slug FROM public.service_categories WHERE is_active = true ORDER BY display_order ASC LIMIT 15');
    console.log("Categories:", res.rows);
  } finally {
    await client.end();
  }
}

checkCategories().catch(console.error);
