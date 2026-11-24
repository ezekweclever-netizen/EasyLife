import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), 'apps/web/.env.local');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function setAdminPassword() {
  const userId = process.env.ADMIN_USER_ID || process.argv[3] || 'eba9a8d2-ec5b-46da-8289-38279bcf333d';
  const newPassword = process.env.ADMIN_PASSWORD || process.argv[2];

  if (!newPassword) {
    console.error("Usage: node scripts/set-admin-password.mjs <new_password> [user_id]");
    process.exit(1);
  }

  console.log(`Setting password for ${userId} at ${supabaseUrl}...`);
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      password: newPassword,
      email_confirm: true
    })
  });

  const data = await res.json();
  if (res.ok) {
    console.log("Success! Admin password updated:", data.email);
  } else {
    console.error("Failed to update password:", res.status, data);
  }
}

setAdminPassword().catch(console.error);
