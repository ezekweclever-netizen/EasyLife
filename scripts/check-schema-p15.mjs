import { getDatabaseUrl } from './_env.mjs';
import pg from 'pg';

const connectionString = getDatabaseUrl();
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));

    const cols = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name IN ('businesses', 'business_members', 'properties', 'assets', 'maintenance_schedules', 'maintenance_records')
      ORDER BY table_name, ordinal_position;
    `);
    console.log('\nColumns:');
    cols.rows.forEach(c => console.log(`  ${c.table_name}.${c.column_name} (${c.data_type})`));

    const enums = await client.query(`
      SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      GROUP BY t.typname;
    `);
    console.log('\nEnums:', enums.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

check().catch(console.error);
