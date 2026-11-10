import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resilience fallback for Windows hosts where local 127.0.0.1 DNS proxy intermittently
// returns ENOTFOUND during rapid multi-process test suites. Preserves native OS lookup
// first and preserves original hostname for PostgreSQL/TLS SNI.
const origDnsLookup = dns.lookup.bind(dns);
const fallbackResolver = new dns.Resolver({ timeout: 2500 });
fallbackResolver.setServers(["8.8.8.8", "1.1.1.1"]);

dns.lookup = function patchedLookup(hostname, options, callback) {
  let opts = options;
  let cb = callback;
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  } else if (typeof opts === "number") {
    opts = { family: opts };
  } else {
    opts = opts || {};
  }

  return origDnsLookup(hostname, opts, (err, address, family) => {
    if (!err) {
      return cb(null, address, family);
    }
    if (!hostname || hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return cb(err);
    }
    fallbackResolver.resolve4(hostname, (rErr, addrs) => {
      if (rErr || !addrs || addrs.length === 0) {
        return cb(err);
      }
      if (opts.all) {
        return cb(
          null,
          addrs.map((a) => ({ address: a, family: 4 }))
        );
      }
      return cb(null, addrs[0], 4);
    });
  });
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

let loaded = false;

export function loadLocalEnv() {
  if (loaded) return;
  loaded = true;

  const candidates = [
    path.join(repoRoot, ".env.local"),
    path.join(repoRoot, "apps", "web", ".env.local"),
    path.join(repoRoot, ".env"),
  ];

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

export function getDatabaseUrl() {
  loadLocalEnv();
  const dbUrl = (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL)?.trim();
  if (!dbUrl) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Add DATABASE_URL to apps/web/.env.local or export it before running database scripts."
    );
  }
  return dbUrl;
}

export async function connectClientWithRetry(ClientCtor, connectionString, maxAttempts = 4) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = new ClientCtor({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 25000,
    });
    client.on("error", () => {});
    try {
      await client.connect();
      return client;
    } catch (err) {
      lastErr = err;
      try {
        await client.end();
      } catch {}
      console.log(`Connection attempt ${attempt}/${maxAttempts} failed (${err.message}). Retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr || new Error("Could not connect to PostgreSQL database.");
}

const errorGuardedClients = new WeakSet();

export async function connectPoolWithRetry(PoolCtor, connectionString, maxAttempts = 4) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const pool = new PoolCtor({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 25000,
    });
    pool.on("error", () => {});
    try {
      const c = await pool.connect();
      if (!errorGuardedClients.has(c)) {
        errorGuardedClients.add(c);
        c.on("error", () => {});
      }
      c.release();
      return pool;
    } catch (err) {
      lastErr = err;
      try {
        await pool.end();
      } catch {}
      console.log(`Pool connection attempt ${attempt}/${maxAttempts} failed (${err.message}). Retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr || new Error("Could not connect to PostgreSQL pool.");
}

export async function queryPoolWithRetry(pool, text, params) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const msg = err?.message || "";
      const isSocketErr =
        err?.code === "ECONNRESET" ||
        err?.code === "EPIPE" ||
        msg.includes("Connection terminated") ||
        msg.includes("not queryable") ||
        msg.includes("closed");
      if (isSocketErr && attempt < 3) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
}

export async function runWithAuth(pool, userId, fn, options = {}) {
  const { asAuthenticated = false } = options;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const tx = await pool.connect();
    if (!errorGuardedClients.has(tx)) {
      errorGuardedClients.add(tx);
      tx.on("error", () => {});
    }
    let brokenSocket = false;
    try {
      await tx.query("BEGIN");
      if (userId) {
        await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true);", [userId]);
        await tx.query("SELECT set_config('request.jwt.claims', $1, true);", [
          JSON.stringify({ sub: userId, role: "authenticated" }),
        ]);
        await tx.query("SELECT set_config('request.jwt.claim.role', 'authenticated', true);");
        if (asAuthenticated) {
          await tx.query("SET LOCAL ROLE authenticated;");
        }
      } else {
        await tx.query("SELECT set_config('request.jwt.claim.sub', NULL, true);");
        await tx.query("SELECT set_config('request.jwt.claims', NULL, true);");
        await tx.query("SELECT set_config('request.jwt.claim.role', NULL, true);");
      }
      const out = await fn(tx);
      await tx.query("COMMIT");
      return out;
    } catch (err) {
      const msg = err?.message || "";
      brokenSocket =
        err?.code === "ECONNRESET" ||
        err?.code === "EPIPE" ||
        msg.includes("Connection terminated") ||
        msg.includes("not queryable") ||
        msg.includes("closed");
      try {
        await tx.query("ROLLBACK");
      } catch {}
      if (brokenSocket && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw err;
    } finally {
      try {
        tx.release(brokenSocket);
      } catch {}
    }
  }
}
