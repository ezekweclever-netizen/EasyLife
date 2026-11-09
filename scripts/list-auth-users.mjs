import { getDatabaseUrl } from './_env.mjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function listAuthUsers() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const res = await client.query('SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 20');
    console.log("Auth users:", res.rows);
  } finally {
    await client.end();
  }
}

listAuthUsers().catch(console.error);
