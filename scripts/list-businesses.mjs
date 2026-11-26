import fs from "fs";
import https from "https";

function fetchJson(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      u,
      { method: options.method || "GET", headers: options.headers || {}, timeout: 30000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const env = fs.readFileSync("apps/web/.env.local", "utf8");
  const getVal = (k) => {
    const line = env.split("\n").find((l) => l.trim().startsWith(k + "="));
    if (!line) return "";
    let val = line.split("=").slice(1).join("=").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  };

  const url = getVal("NEXT_PUBLIC_SUPABASE_URL");
  const key = getVal("SUPABASE_SERVICE_ROLE_KEY");

  const r = await fetchJson(`${url}/rest/v1/businesses?select=id,name,slug,city,business_category,verification_status`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log("Businesses in DB:", r.data);
}

main().catch(console.error);
