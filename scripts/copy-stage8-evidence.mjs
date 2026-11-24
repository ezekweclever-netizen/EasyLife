import fs from "fs";
import path from "path";

const src = "C:/Users/HP/.gemini/antigravity/brain/b1e90b2f-505e-4576-a056-a4925692cca3/browser_sandbox/screenshots";
const dst1 = "C:/Users/HP/Documents/EasyLife/browser_evidence/stage8";
const dst2 = "C:/Users/HP/.gemini/antigravity/brain/d6306399-a71b-4865-8261-2275f9a04440/browser_evidence/stage8";

fs.mkdirSync(dst1, { recursive: true });
fs.mkdirSync(dst2, { recursive: true });

const files = [
  ["step_2_shot_1_desktop_light_business_hub.png", "desktop_light_business_hub.png"],
  ["step_17_shot_1_desktop_light_business_profile.png", "desktop_light_business_profile.png"],
  ["step_21_shot_1_desktop_dark_business_hub.png", "desktop_dark_business_hub.png"],
  ["step_25_shot_1_tablet_business_hub.png", "tablet_business_hub.png"],
  ["step_29_shot_1_mobile_business_hub.png", "mobile_business_hub.png"],
  ["step_29_shot_3_mobile_business_profile.png", "mobile_business_profile.png"],
];

for (const [srcName, dstName] of files) {
  const sourcePath = path.join(src, srcName);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, path.join(dst1, dstName));
    fs.copyFileSync(sourcePath, path.join(dst2, dstName));
    console.log(`Copied: ${dstName}`);
  } else {
    console.warn(`Source not found: ${srcName}`);
  }
}
