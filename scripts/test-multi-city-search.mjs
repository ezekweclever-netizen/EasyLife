import { getDatabaseUrl } from './_env.mjs';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
const { Client } = pg;

const CONNECTION_STRING = getDatabaseUrl();

async function testMultiCitySearch() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Testing Multi-City Search & Matching RPC...");

  try {
    // 1. Search in Port Harcourt
    const phRes = await client.query(`
      SELECT business_name, primary_city, category_name, distance_km, match_score
      FROM public.match_service_professionals(p_city := 'Port Harcourt', p_limit := 5);
    `);
    console.log("\n📍 Port Harcourt Search Results (" + phRes.rows.length + " found):");
    console.table(phRes.rows);

    // 2. Search in Lagos
    const lagosRes = await client.query(`
      SELECT business_name, primary_city, category_name, distance_km, match_score
      FROM public.match_service_professionals(p_city := 'Lagos', p_limit := 5);
    `);
    console.log("\n📍 Lagos Search Results (" + lagosRes.rows.length + " found):");
    console.table(lagosRes.rows);

    // 3. Search in Abuja
    const abujaRes = await client.query(`
      SELECT business_name, primary_city, category_name, distance_km, match_score
      FROM public.match_service_professionals(p_city := 'Abuja', p_limit := 5);
    `);
    console.log("\n📍 Abuja Search Results (" + abujaRes.rows.length + " found):");
    console.table(abujaRes.rows);

    // 4. Search by specific sub-service keyword across hubs
    const solarRes = await client.query(`
      SELECT business_name, primary_city, category_name, match_score
      FROM public.match_service_professionals(p_keyword := 'Solar Panel', p_limit := 5);
    `);
    console.log("\n🔍 Sub-service Keyword 'Solar Panel' Results (" + solarRes.rows.length + " found):");
    console.table(solarRes.rows);

    const chillerRes = await client.query(`
      SELECT business_name, primary_city, category_name, match_score
      FROM public.match_service_professionals(p_keyword := 'Chiller', p_limit := 5);
    `);
    console.log("\n🔍 Sub-service Keyword 'Chiller' Results (" + chillerRes.rows.length + " found):");
    console.table(chillerRes.rows);

  } finally {
    await client.end();
  }
}

testMultiCitySearch().catch(console.error);
