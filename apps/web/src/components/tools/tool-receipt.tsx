"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

export function ToolReceipt() {
  const [bizName, setBizName] = useState("ProFit Engineering & Air Conditioning");
  const [bizAddress, setBizAddress] = useState("28 Aba Road, Port Harcourt, Rivers State");
  const [bizPhone, setBizPhone] = useState("+234 802 345 6789");

  const [receivedFrom, setReceivedFrom] = useState("Mrs. Stella Amadi");
  const [receiptNum, setReceiptNum] = useState("RCP-2026-109");
  const [receiptDate, setReceiptDate] = useState("2026-11-24");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [txRef, setTxRef] = useState("ZEN-TRF-982310492");

  const [serviceDescription, setServiceDescription] = useState(
    "Full overhaul, coil flushing, and capacitor replacement for 2 units 2.0HP Inverter AC"
  );
  const [totalBill, setTotalBill] = useState("85000");
  const [amountPaid, setAmountPaid] = useState("85000");
  const [amountInWords, setAmountInWords] = useState("Eighty-Five Thousand Naira Only");
  const [issuedBy, setIssuedBy] = useState("Engr. Kenneth Okon (Lead Service Engineer)");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const bill = parseFloat(totalBill) || 0;
  const paid = parseFloat(amountPaid) || 0;
  const balance = Math.max(0, bill - paid);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#E8590C] dark:text-[#F06A1F] uppercase tracking-wider">
          Financial Records
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Official Payment Receipt Generator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Issue verified payment acknowledgment slips with transaction reference codes, payment method badges, and amount in words.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#1F2328] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-[#E8590C] uppercase tracking-wider block">
              Issuing Business Details
            </span>
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              placeholder="Business Name"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-bold"
            />
            <input
              type="text"
              value={bizAddress}
              onChange={(e) => setBizAddress(e.target.value)}
              placeholder="Business Address"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
            <input
              type="text"
              value={bizPhone}
              onChange={(e) => setBizPhone(e.target.value)}
              placeholder="Business Phone"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
          </div>

          <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Customer &amp; Payment Details
            </span>
            <input
              type="text"
              value={receivedFrom}
              onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="Received From (Payer)"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-bold"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
              >
                <option value="Bank Transfer">Bank Transfer (NIP)</option>
                <option value="POS Terminal">POS Card Payment</option>
                <option value="Cash">Cash Settlement</option>
                <option value="Cheque">Bank Draft / Cheque</option>
              </select>
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="Transaction / POS Ref"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Service / Merchandise Description</label>
            <textarea
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1">Total Project Bill (₦)</label>
              <input
                type="number"
                value={totalBill}
                onChange={(e) => setTotalBill(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Amount Paid (₦)</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-mono font-bold text-[#E8590C]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Balance Remaining (₦)</label>
              <div className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono font-bold">
                ₦{balance.toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Amount in Words</label>
            <input
              type="text"
              value={amountInWords}
              onChange={(e) => setAmountInWords(e.target.value)}
              placeholder="e.g. Eighty-Five Thousand Naira Only"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold mb-1">Received / Authorized By</label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Receipt Date</label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Official Payment Receipt</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Official Receipt — ${receiptNum}`}
        badge="Payment Receipt"
        filename={`receipt-${receiptNum.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
        summaryText={`EasyLife Official Receipt: ${receiptNum}\nIssued By: ${bizName}\nReceived From: ${receivedFrom}\nAmount Paid: ₦${paid.toLocaleString()}\nMethod: ${paymentMethod} (${txRef})`}
      >
        <div className="space-y-6 text-slate-800">
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">OFFICIAL RECEIPT</h1>
              <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">#{receiptNum}</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-900">{bizName}</p>
              <p className="text-slate-500">{bizAddress}</p>
              <p className="text-slate-500">{bizPhone}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Received From:</span>
              <span className="font-black text-slate-900 text-sm">{receivedFrom}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Being Payment For:</span>
              <span className="font-medium text-slate-800 text-right max-w-sm">{serviceDescription}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Payment Method &amp; Reference:</span>
              <span className="font-mono font-bold text-slate-800">
                {paymentMethod} • Ref: {txRef}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 uppercase text-[10px] font-bold">Amount in Words:</span>
              <span className="italic font-bold text-slate-900">{amountInWords}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Project Billing:</span>
              <span className="font-mono text-sm text-slate-600">₦{bill.toLocaleString()}</span>
              {balance > 0 && (
                <p className="text-rose-600 font-bold text-xs mt-1">
                  Outstanding Balance: ₦{balance.toLocaleString()}
                </p>
              )}
            </div>

            <div className="text-right p-4 bg-[#FCEBDD] border border-[#E8590C]/30 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-teal-800 block">Amount Received</span>
              <span className="text-2xl font-black text-[#E8590C] font-mono">
                ₦{paid.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Payment Acknowledged on:</p>
              <p className="font-bold text-slate-800">{receiptDate}</p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-900">{issuedBy}</p>
              <p className="text-[10px] text-slate-400">Authorized Signature &amp; Stamp</p>
            </div>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
