import { getDatabaseUrl } from './_env.mjs';
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false }
});
async function run() {
  const res = await pool.query('SELECT get_admin_dashboard_metrics() as metrics');
  console.log('Metrics successfully computed:\n', JSON.stringify(res.rows[0].metrics, null, 2));
  await pool.end();
}
run();
