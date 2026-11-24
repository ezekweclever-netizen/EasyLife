import fs from "fs";
import path from "path";

const src = "C:/Users/HP/.gemini/antigravity/brain/51d60ed3-6503-4aea-9d6f-f9c8340b0b50/browser_sandbox/screenshots";
const dst1 = "C:/Users/HP/Documents/EasyLife/browser_evidence/stage7";
const dst2 = "C:/Users/HP/.gemini/antigravity/brain/d6306399-a71b-4865-8261-2275f9a04440/browser_evidence/stage7";

fs.mkdirSync(dst1, { recursive: true });
fs.mkdirSync(dst2, { recursive: true });

const files = [
  ["step_16_shot_1_desktop_light_jobs_discovery.png", "desktop_light_jobs_discovery.png"],
  ["step_24_shot_1_desktop_light_job_detail.png", "desktop_light_job_detail.png"],
  ["step_45_shot_1_desktop_light_apply_modal.png", "desktop_light_apply_modal.png"],
  ["step_47_shot_1_desktop_light_finishing_tiler.png", "desktop_light_finishing_tiler.png"],
  ["step_30_shot_1_desktop_dark_jobs_discovery.png", "desktop_dark_jobs_discovery.png"],
  ["step_30_shot_2_tablet_jobs_discovery.png", "tablet_jobs_discovery.png"],
  ["step_32_shot_1_mobile_jobs_discovery.png", "mobile_jobs_discovery.png"],
  ["step_32_shot_2_mobile_job_detail.png", "mobile_job_detail.png"],
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
