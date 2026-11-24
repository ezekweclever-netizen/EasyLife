import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

// Test with anon key
const anonRes = await fetch(
  env.NEXT_PUBLIC_SUPABASE_URL +
    "/rest/v1/job_vacancies?slug=eq.senior-solar-inverter-battery-technician-ph&select=*",
  {
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  }
);
console.log("Anon query status:", anonRes.status);
const anonData = await anonRes.json();
console.log("Anon data:", anonData);

// Test with service key
const adminRes = await fetch(
  env.NEXT_PUBLIC_SUPABASE_URL +
    "/rest/v1/job_vacancies?slug=eq.senior-solar-inverter-battery-technician-ph&select=*",
  {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
  }
);
console.log("Admin query status:", adminRes.status);
const adminData = await adminRes.json();
console.log("Admin data:", adminData);
