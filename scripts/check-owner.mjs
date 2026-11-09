import { getDatabaseUrl } from './_env.mjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function checkOwnerProfile() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const p = await client.query("SELECT * FROM public.profiles WHERE email = 'ezekweclever@gmail.com'");
    console.log("Profile for ezekweclever@gmail.com:", p.rows);

    const r = await client.query("SELECT * FROM public.user_roles WHERE user_id = 'eba9a8d2-ec5b-46da-8289-38279bcf333d'");
    console.log("Roles for ezekweclever@gmail.com:", r.rows);
  } finally {
    await client.end();
  }
}

checkOwnerProfile().catch(console.error);
