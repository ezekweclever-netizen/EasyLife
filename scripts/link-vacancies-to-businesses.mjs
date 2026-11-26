import fs from "fs";

const content = fs.readFileSync("apps/web/.env.local", "utf8");
const env = {};
content.split("\n").forEach((l) => {
  const m = l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || "").replace(/^"|"$/g, "").trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// 1. Fetch businesses
const bizRes = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=id,name,slug,city,owner_id`, {
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  },
});
const businesses = await bizRes.json();
console.log("Found businesses:", businesses.length);

const apexSolar = businesses.find((b) => b.slug.includes("apex-solar") || b.name.includes("Apex Solar"));
const benchmark = businesses.find((b) => b.slug.includes("benchmark") || b.name.includes("Benchmark"));
const ndCorporate = businesses.find((b) => b.slug.includes("niger-delta-corporate") || b.name.includes("Niger Delta Corporate"));

console.log("Apex Solar:", apexSolar?.id);
console.log("Benchmark:", benchmark?.id);
console.log("ND Corporate:", ndCorporate?.id);

// 2. Fetch vacancies
const vacRes = await fetch(`${SUPABASE_URL}/rest/v1/job_vacancies?select=id,slug,title`, {
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  },
});
const vacancies = await vacRes.json();

const mappings = {
  "senior-solar-inverter-battery-technician-ph": apexSolar?.id || ndCorporate?.id,
  "commercial-hvac-maintenance-specialist-lagos": benchmark?.id,
  "heavy-duty-diesel-generator-engineer-abuja": apexSolar?.id,
  "vocational-plumbing-apprentice-ph": ndCorporate?.id || apexSolar?.id,
  "industrial-facility-electrician-lagos": benchmark?.id,
  "finishing-tiler-decorative-painter-abuja": apexSolar?.id,
};

for (const vac of vacancies) {
  const targetBizId = mappings[vac.slug];
  if (targetBizId) {
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/job_vacancies?id=eq.${vac.id}`, {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_id: targetBizId,
      }),
    });
    console.log(`Updated ${vac.slug} -> business_id: ${targetBizId}, status: ${updateRes.status}`);
  }
}

console.log("Vacancies successfully linked to businesses.");
