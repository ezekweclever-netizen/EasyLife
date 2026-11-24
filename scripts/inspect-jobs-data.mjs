import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const res = await fetch(
  env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/job_vacancies?select=*&limit=5",
  {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization:
        "Bearer " +
        (env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
  }
);
const data = await res.json();
console.log("Status:", res.status, "Count:", Array.isArray(data) ? data.length : data);
if (Array.isArray(data) && data.length > 0) {
  console.log("Sample:", data[0].title);
  console.log("Keys:", Object.keys(data[0]));
}
