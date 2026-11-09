import { getDatabaseUrl } from './_env.mjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function verifyData() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const res = await client.query('SELECT state, city, COUNT(*) as count FROM public.operating_neighbourhoods GROUP BY state, city ORDER BY count DESC');
    console.log("Operating neighbourhoods by city/state:", res.rows);

    const pros = await client.query('SELECT primary_city, COUNT(*) as count FROM public.professional_profiles GROUP BY primary_city ORDER BY count DESC');
    console.log("Professionals by primary city:", pros.rows);
  } finally {
    await client.end();
  }
}

verifyData().catch(console.error);
