import { getDatabaseUrl } from './_env.mjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function checkAdmin() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.full_name, p.primary_role, ur.role as assigned_role, ur.is_active as role_active, u.email
      FROM public.profiles p
      LEFT JOIN public.user_roles ur ON ur.user_id = p.id
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE ur.role = 'admin' OR p.primary_role = 'admin'
    `);
    console.log("Admins found:", res.rows);
  } finally {
    await client.end();
  }
}

checkAdmin().catch(console.error);
