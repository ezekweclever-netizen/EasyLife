import { getDatabaseUrl } from './_env.mjs';
import { Client } from 'pg';

async function main() {
  const client = new Client({ connectionString: getDatabaseUrl(), ssl: { rejectUnauthorized: false } });

  await client.connect();
  console.log('Connected.');

  await client.query(`
    CREATE OR REPLACE FUNCTION public.generate_reference_code(prefix TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    AS $$
    DECLARE
      random_suffix TEXT;
    BEGIN
      random_suffix := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
      RETURN upper(prefix) || '-' || to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || random_suffix;
    END;
    $$;
  `);

  const res = await client.query("SELECT public.generate_reference_code('EL-QT') AS code;");
  console.log('Tested generated code:', res.rows[0].code);

  await client.end();
  console.log('Done.');
}

main().catch(console.error);
