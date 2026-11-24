"use client";

export interface PdfExportOptions {
  orientation?: "portrait" | "landscape";
  title?: string;
  marginMm?: number;
}

/**
 * Dynamically loads jsPDF and html2canvas-pro on client-side, renders target element,
 * and generates a high-resolution, multi-page vector-framed PDF with full support for modern CSS color spaces (oklab, oklch).
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  options?: PdfExportOptions
): Promise<Blob | null> {
  if (typeof window === "undefined" || !element) {
    return null;
  }

  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas-pro");

    const canvas = await html2canvas(element, {
      scale: 2, // 2x high-DPI retina sharpness
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: Math.max(element.scrollWidth, 800),
    });

    const imgData = canvas.toDataURL("image/png");
    const orientation = options?.orientation || "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pageWidth = orientation === "portrait" ? 210 : 297;
    const pageHeight = orientation === "portrait" ? 297 : 210;
    const margin = options?.marginMm ?? 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;
    let pageNum = 1;

    // Page 1
    pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
    heightLeft -= pageHeight - margin * 2;

    // Multi-page handling with clean page additions
    while (heightLeft > 0) {
      position = -(pageHeight - margin * 2) * pageNum + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
      pageNum++;
      heightLeft -= pageHeight - margin * 2;
    }

    const cleanFilename = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return pdf.output("blob");
  } catch (error) {
    console.error("PDF export error:", error);
    return null;
  }
}

/**
 * Generates the PDF Blob in memory without triggering automatic download,
 * for immediate native file sharing via Web Share API.
 */
export async function generatePdfBlob(
  element: HTMLElement,
  options?: PdfExportOptions
): Promise<Blob | null> {
  if (typeof window === "undefined" || !element) {
    return null;
  }

  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas-pro");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: Math.max(element.scrollWidth, 800),
    });

    const imgData = canvas.toDataURL("image/png");
    const orientation = options?.orientation || "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pageWidth = orientation === "portrait" ? 210 : 297;
    const pageHeight = orientation === "portrait" ? 297 : 210;
    const margin = options?.marginMm ?? 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;
    let pageNum = 1;

    pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = -(pageHeight - margin * 2) * pageNum + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, contentWidth, contentHeight, undefined, "FAST");
      pageNum++;
      heightLeft -= pageHeight - margin * 2;
    }

    return pdf.output("blob");
  } catch (err) {
    console.error("Generate PDF blob error:", err);
    return null;
  }
}

/**
 * Universal document sharing: tries native file share -> Web Share text -> Clipboard copy.
 */
export async function shareDocumentAction(options: {
  title: string;
  text: string;
  pdfBlob?: Blob | null;
  filename?: string;
}): Promise<{ success: boolean; method: "file" | "text" | "clipboard" }> {
  const { title, text, pdfBlob, filename = "document.pdf" } = options;

  if (typeof navigator === "undefined") {
    return { success: false, method: "clipboard" };
  }

  // 1. Try native file share if Blob available
  if (pdfBlob && typeof navigator.canShare === "function") {
    try {
      const file = new File([pdfBlob], filename, { type: "application/pdf" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return { success: true, method: "file" };
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return { success: false, method: "file" };
      }
    }
  }

  // 2. Try text / URL share
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        text: `${text}\n\nGenerated with EasyLife Nigeria Free Tools (https://easylife.ng/tools)`,
        url: window.location.href,
      });
      return { success: true, method: "text" };
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return { success: false, method: "text" };
      }
    }
  }

  // 3. Fallback to clipboard
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(
        `${title}\n\n${text}\n\nGenerated with EasyLife Nigeria Free Tools (https://easylife.ng/tools)`
      );
      return { success: true, method: "clipboard" };
    } catch {
      // Ignored
    }
  }

  return { success: false, method: "clipboard" };
}
