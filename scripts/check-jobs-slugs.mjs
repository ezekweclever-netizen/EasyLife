import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const res = await fetch(
  `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/job_vacancies?select=id,slug,title,status,moderation_status`,
  {
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  }
);
const data = await res.json();
console.log("Jobs in DB:", data);
