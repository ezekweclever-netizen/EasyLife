import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import https from "node:https";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const fonts = [
  {
    name: "GeneralSans-Regular.ttf",
    url: "https://cdn.fontshare.com/wf/MFQT7HFGCR2L5ULQTW6YXYZXXHMPKLJ3/YWQ244D6TACUX5JBKATPOW5I5MGJ3G73/7YY3ZAAE3TRV2LANYOLXNHTPHLXVWTKH.ttf",
  },
  {
    name: "GeneralSans-Medium.ttf",
    url: "https://cdn.fontshare.com/wf/3RZHWSNONLLWJK3RLPEKUZOMM56GO4LJ/BPDRY7AHVI3MCDXXVXTQQ76H3UXA63S3/SB2OEB6IKZPRR6JT4GFJ2TFT6HBB6AZN.ttf",
  },
  {
    name: "GeneralSans-Semibold.ttf",
    url: "https://cdn.fontshare.com/wf/K46YRH762FH3QJ25IQM3VAXAKCHEXXW4/ISLWQPUZHZF33LRIOTBMFOJL57GBGQ4B/3ZLMEXZEQPLTEPMHTQDAUXP5ZZXCZAEN.ttf",
  },
  {
    name: "GeneralSans-Bold.ttf",
    url: "https://cdn.fontshare.com/wf/KWXO5X3YW4X7OLUMPO4X24HQJGJU7E2Q/VOWUQZS3YLP66ZHPTXAFSH6YACY4WJHT/NIQ54PVBBIWVK3PFSOIOUJSXIJ5WTNDP.ttf",
  },
];

const mobileFontsDir = path.join(process.cwd(), "apps", "mobile", "assets", "fonts");
const webFontsDir = path.join(process.cwd(), "apps", "web", "public", "fonts");

fs.mkdirSync(mobileFontsDir, { recursive: true });
fs.mkdirSync(webFontsDir, { recursive: true });

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        resolve();
      });
      stream.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  for (const f of fonts) {
    const mobilePath = path.join(mobileFontsDir, f.name);
    const webPath = path.join(webFontsDir, f.name);
    console.log(`Downloading ${f.name}...`);
    await downloadFile(f.url, mobilePath);
    fs.copyFileSync(mobilePath, webPath);
    console.log(`Saved ${f.name} (${fs.statSync(mobilePath).size} bytes)`);
  }
  console.log("All General Sans fonts successfully downloaded.");
}

main().catch(err => {
  console.error("Download failed:", err);
  process.exit(1);
});
