import fs from 'node:fs';
import path from 'node:path';

const srcDir = 'C:/Users/HP/.gemini/antigravity/brain/97058925-ad10-4b8c-8686-278d06dc0f20/browser_sandbox/screenshots';
const destDir = 'C:/Users/HP/.gemini/antigravity/brain/d6306399-a71b-4865-8261-2275f9a04440/browser_evidence/stage12';

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  console.log(`Found ${files.length} files in subagent screenshot dir.`);
  for (const file of files) {
    if (file.includes('stage12_') || file.endsWith('.png')) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied: ${file} (${fs.statSync(destFile).size} bytes)`);
    }
  }
} else {
  console.log('Source directory not yet available.');
}
