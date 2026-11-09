import { getDatabaseUrl } from './_env.mjs';
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function inspect() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const psa = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'professional_service_areas' 
      ORDER BY ordinal_position
    `);
    console.log("professional_service_areas columns:", psa.rows.map(r => r.column_name));

    const ps = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'professional_services' 
      ORDER BY ordinal_position
    `);
    console.log("professional_services columns:", ps.rows.map(r => r.column_name));

    const on = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'operating_neighbourhoods' 
      ORDER BY ordinal_position
    `);
    console.log("operating_neighbourhoods columns:", on.rows.map(r => r.column_name));

  } finally {
    await client.end();
  }
}

inspect().catch(console.error);
