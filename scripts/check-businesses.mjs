import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const res = await fetch(
  `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/businesses?select=id,name,slug,business_category,industry,city,state,verification_status,is_directory_listed,is_active`,
  {
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  }
);
const data = await res.json();
console.log("Businesses in DB:", data);
