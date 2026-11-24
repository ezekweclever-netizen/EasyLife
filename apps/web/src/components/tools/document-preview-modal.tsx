"use client";

import React, { useRef, useState } from "react";
import { exportElementToPdf, generatePdfBlob, shareDocumentAction } from "./pdf-export";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  filename: string;
  summaryText: string;
  children: React.ReactNode;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  badge = "Official Document",
  filename,
  summaryText,
  children,
}: DocumentPreviewModalProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSavePdf = async () => {
    if (!documentRef.current || isExporting) return;
    setIsExporting(true);
    showToast("Generating high-resolution PDF...");
    try {
      const blob = await exportElementToPdf(documentRef.current, filename);
      if (blob) {
        showToast("PDF downloaded successfully!");
      } else {
        showToast("Could not generate PDF. Please try browser print.");
      }
    } catch {
      showToast("Error generating PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!documentRef.current || isSharing) return;
    setIsSharing(true);
    showToast("Preparing document for sharing...");
    try {
      const blob = await generatePdfBlob(documentRef.current);
      const res = await shareDocumentAction({
        title,
        text: summaryText,
        pdfBlob: blob,
        filename,
      });

      if (res.method === "file") {
        showToast("Document PDF shared successfully!");
      } else if (res.method === "text") {
        showToast("Document details shared!");
      } else {
        showToast("Document summary copied to clipboard!");
      }
    } catch {
      showToast("Sharing failed.");
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-teal-500/50 flex items-center gap-2 animate-fade-in print:hidden">
          <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-white dark:bg-[#071526] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between gap-3 p-3 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0D223A]/90 print:hidden">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-[#0D9488] dark:text-[#5CD3D5] border border-teal-200 dark:border-teal-800/60 shrink-0">
              {badge}
            </span>
            <h2 className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white truncate">
              {title}
            </h2>
          </div>

          {/* Three Mandatory Actions + Print & Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Action 1: View (Inspection mode indicator) */}
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#071526] border border-slate-200 dark:border-slate-700">
              <svg className="w-3.5 h-3.5 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview</span>
            </span>

            {/* Action 2: Share */}
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#071526] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Share document or PDF outside EasyLife"
            >
              <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>{isSharing ? "Sharing..." : "Share"}</span>
            </button>

            {/* Action 3: Save as PDF */}
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isExporting}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-[#0D9488] hover:bg-[#0B7A6F] shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download high-resolution multi-page PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{isExporting ? "Saving..." : "Save as PDF"}</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#071526] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition hidden md:flex items-center gap-1 cursor-pointer"
              title="Print document"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close Preview"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-8 bg-slate-100 dark:bg-[#040B13] flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* Printable Document Paper Card */}
          <div
            ref={documentRef}
            className="w-full max-w-[800px] bg-white text-slate-900 p-5 sm:p-10 rounded-xl shadow-lg border border-slate-200/80 my-auto print:shadow-none print:border-none print:m-0 print:p-6 print:max-w-none print:text-black"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* Universal Document Header with EasyLife Seal & Branding */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center text-white font-black text-sm">
                    EL
                  </div>
                  <span className="text-xl font-black tracking-tight text-slate-900">
                    Easy<span className="text-[#0D9488]">Life</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                  Everyday Problems. Smarter Solutions. • Nigeria
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  {badge}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Issued: {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Document Body Injected from Tool */}
            <div className="space-y-6">
              {children}
            </div>

            {/* Universal Document Footer with Verification Tag & Security Disclaimer */}
            <div className="border-t border-slate-200 pt-6 mt-12 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Generated via EasyLife Free Tools Engine • Verified Layout</span>
              </div>
              <div>www.easylife.ng • Port Harcourt, Lagos, Abuja</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar for Mobile Quick Actions */}
        <div className="flex sm:hidden items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071526] print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              Share
            </button>
            <button
              type="button"
              onClick={handleSavePdf}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0D9488] text-white"
            >
              Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
