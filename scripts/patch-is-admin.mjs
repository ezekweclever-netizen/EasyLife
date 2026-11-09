import { getDatabaseUrl } from './_env.mjs';
import pg from "pg";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dbConnStr =
  getDatabaseUrl();

const pool = new pg.Pool({
  connectionString: dbConnStr,
  ssl: { rejectUnauthorized: false },
});

const sql = `
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. If service_role JWT is presented, grant admin
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  -- 2. If no authenticated user is in context, allow direct db maintenance if session_user is superuser
  IF auth.uid() IS NULL AND SESSION_USER IN ('postgres', 'supabase_admin') THEN
    RETURN true;
  END IF;

  -- 3. When an auth.uid() is present, strictly check user_roles
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.is_suspended = false
      AND p.deleted_at IS NULL
      AND ur.role = 'admin'
      AND ur.is_active = true
  );
END;
$$;
`;

async function run() {
  try {
    await pool.query(sql);
    console.log("Successfully updated public.is_admin() on remote Supabase database.");
  } catch (err) {
    console.error("Failed to update public.is_admin():", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
