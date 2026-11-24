import fs from "fs";
import path from "path";

const src = "C:/Users/HP/.gemini/antigravity/brain/4c04270a-032b-4eaf-a185-99f22981ca78/browser_sandbox/screenshots";
const dst1 = "C:/Users/HP/Documents/EasyLife/browser_evidence/stage9";
const dst2 = "C:/Users/HP/.gemini/antigravity/brain/d6306399-a71b-4865-8261-2275f9a04440/browser_evidence/stage9";

fs.mkdirSync(dst1, { recursive: true });
fs.mkdirSync(dst2, { recursive: true });

const files = [
  ["step_2_shot_1_desktop_light_tools_catalog.png", "desktop_light_tools_catalog.png"],
  ["step_12_shot_1_desktop_light_percentage_calculator.png", "desktop_light_percentage_calculator.png"],
  ["step_14_shot_1_desktop_light_invoice_generator.png", "desktop_light_invoice_generator.png"],
  ["step_16_shot_1_desktop_light_ai_problem_assistant.png", "desktop_light_ai_problem_assistant.png"],
  ["step_18_shot_1_desktop_dark_tools_catalog.png", "desktop_dark_tools_catalog.png"],
  ["step_20_shot_1_tablet_tools_catalog.png", "tablet_tools_catalog.png"],
  ["step_22_shot_1_mobile_tools_catalog.png", "mobile_tools_catalog.png"],
  ["step_38_shot_1_mobile_tool_percentage_fixed.png", "mobile_tool_percentage_fixed.png"],
  ["step_43_shot_1_currency_converter_icon.png", "currency_converter_icon.png"],
  ["step_51_shot_1_desktop_invoice_document_modal.png", "desktop_invoice_document_modal.png"],
  ["step_54_shot_1_desktop_cv_document_modal.png", "desktop_cv_document_modal.png"],
  ["step_57_shot_1_desktop_cover_letter_modal.png", "desktop_cover_letter_modal.png"],
  ["step_60_shot_1_mobile_invoice_document_modal.png", "mobile_invoice_document_modal.png"],
  ["step_66_shot_1_desktop_invoice_modal_header_fixed.png", "desktop_invoice_modal_header_fixed.png"],
  ["step_69_shot_1_mobile_invoice_modal_fixed.png", "mobile_invoice_modal_fixed.png"]
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
