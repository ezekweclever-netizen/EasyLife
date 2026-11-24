"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

interface InvoiceItem {
  id: string;
  desc: string;
  qty: number;
  rate: number;
}

export function ToolInvoice() {
  const [bizName, setBizName] = useState("DeltaSpark Electricals & Solar Ltd");
  const [bizAddress, setBizAddress] = useState("Plot 14 Stadium Road, Port Harcourt, Rivers State");
  const [bizPhone, setBizPhone] = useState("+234 803 123 4567");
  const [bizCac, setBizCac] = useState("RC 1892044");

  const [clientName, setClientName] = useState("Chief Emmanuel Briggs");
  const [clientAddress, setClientAddress] = useState("12 Peter Odili Road, Trans-Amadi, Port Harcourt");
  const [clientPhone, setClientPhone] = useState("+234 809 888 7766");

  const [invNum, setInvNum] = useState("INV-2026-042");
  const [invDate, setInvDate] = useState("2026-11-24");
  const [dueDate, setDueDate] = useState("2026-12-08");

  const [bankName, setBankName] = useState("Zenith Bank Plc");
  const [acctNum, setAcctNum] = useState("1014829304");
  const [acctName, setAcctName] = useState("DeltaSpark Electricals Ltd");

  const [applyVat, setApplyVat] = useState(true);
  const [discountPercent, setDiscountPercent] = useState(0);

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", desc: "Supply & Installation of 5kVA Hybrid Solar Inverter System", qty: 1, rate: 850000 },
    { id: "2", desc: "200Ah 12V Deep Cycle Tubular Batteries (String of 4)", qty: 4, rate: 220000 },
    { id: "3", desc: "Heavy-Gauge 25mm Pure Copper DC Interconnect Cables & Lugs", qty: 1, rate: 45000 },
    { id: "4", desc: "Labor, DB Board Surge Protection & Rapid Commissioning", qty: 1, rate: 75000 },
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), desc: "Additional Technical Materials / Service", qty: 1, rate: 25000 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: "desc" | "qty" | "rate", val: any) => {
    setItems(
      items.map((it) => {
        if (it.id !== id) return it;
        return { ...it, [field]: val };
      })
    );
  };

  const subtotal = items.reduce((sum, it) => sum + (it.qty || 0) * (it.rate || 0), 0);
  const discountAmount = subtotal * ((discountPercent || 0) / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const vatAmount = applyVat ? subtotalAfterDiscount * 0.075 : 0;
  const grandTotal = subtotalAfterDiscount + vatAmount;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Commercial Invoicing
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Professional Tax Invoice Generator
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Issue polished commercial invoices with itemized materials and labor, Nigerian 7.5% VAT, bank settlement details, and PDF export.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Company & Client Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider block">
              Billed From (Your Business)
            </span>
            <input
              type="text"
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              placeholder="Business Name"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-bold"
            />
            <input
              type="text"
              value={bizAddress}
              onChange={(e) => setBizAddress(e.target.value)}
              placeholder="Business Address"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs"
              />
              <input
                type="text"
                value={bizCac}
                onChange={(e) => setBizCac(e.target.value)}
                placeholder="CAC RC / BN Number"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs"
              />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Billed To (Client / Customer)
            </span>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client / Company Name"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs font-bold"
            />
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="Delivery / Project Address"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs"
            />
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Client Phone Number"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-xs"
            />
          </div>
        </div>

        {/* Invoice Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <label className="block font-bold mb-1">Invoice Number</label>
            <input
              type="text"
              value={invNum}
              onChange={(e) => setInvNum(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526]"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Issue Date</label>
            <input
              type="date"
              value={invDate}
              onChange={(e) => setInvDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526]"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Payment Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526]"
            />
          </div>
        </div>

        {/* Dynamic Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Itemized Materials &amp; Labor
            </span>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0B7A6F] transition cursor-pointer"
            >
              + Add Line Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                <input
                  type="text"
                  value={it.desc}
                  onChange={(e) => updateItem(it.id, "desc", e.target.value)}
                  placeholder="Item description"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={it.qty}
                    onChange={(e) => updateItem(it.id, "qty", parseFloat(e.target.value) || 0)}
                    placeholder="Qty"
                    className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-center"
                  />
                  <input
                    type="number"
                    value={it.rate}
                    onChange={(e) => updateItem(it.id, "rate", parseFloat(e.target.value) || 0)}
                    placeholder="Rate (₦)"
                    className="w-28 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-right font-mono"
                  />
                  <span className="w-28 text-right font-bold text-slate-900 dark:text-white font-mono">
                    ₦{((it.qty || 0) * (it.rate || 0)).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Calculation Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Bank Settlement Account */}
          <div className="p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Direct Bank Settlement Details
            </span>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Bank Name (e.g. Zenith Bank)"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={acctNum}
                onChange={(e) => setAcctNum(e.target.value)}
                placeholder="NUBAN Account Number"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] font-mono"
              />
              <input
                type="text"
                value={acctName}
                onChange={(e) => setAcctName(e.target.value)}
                placeholder="Account Name"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526]"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="p-4 bg-teal-50/70 dark:bg-[#0D223A] rounded-xl border border-teal-200/90 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">₦{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                />
                <span>Include 7.5% Nigerian VAT</span>
              </label>
              <span className="font-mono">{applyVat ? `₦${Math.round(vatAmount).toLocaleString()}` : "₦0"}</span>
            </div>

            <div className="border-t border-teal-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm">
              <span className="font-black text-slate-900 dark:text-white uppercase">Total Due:</span>
              <span className="text-xl font-black text-[#0D9488] dark:text-[#5CD3D5] font-mono">
                ₦{Math.round(grandTotal).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* View Document Action */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Formatted Commercial Invoice</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Commercial Invoice — ${invNum}`}
        badge="Tax Invoice"
        filename={`invoice-${invNum.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
        summaryText={`EasyLife Commercial Invoice: ${invNum}\nBilled From: ${bizName}\nBilled To: ${clientName}\nGrand Total: ₦${Math.round(grandTotal).toLocaleString()}\nDue Date: ${dueDate}`}
      >
        <div className="space-y-6 text-slate-800">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-900 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
              <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">#{invNum}</p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-900">{bizName}</p>
              <p className="text-slate-500">{bizAddress}</p>
              <p className="text-slate-500">{bizPhone} • {bizCac}</p>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billed To</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{clientName}</p>
              <p className="text-slate-600">{clientAddress}</p>
              <p className="text-slate-600">{clientPhone}</p>
            </div>
            <div className="text-right space-y-1">
              <div>
                <span className="text-slate-400">Date Issued:</span>{" "}
                <span className="font-bold text-slate-800">{invDate}</span>
              </div>
              <div>
                <span className="text-slate-400">Due Date:</span>{" "}
                <span className="font-bold text-slate-800">{dueDate}</span>
              </div>
              <div>
                <span className="text-slate-400">Payment Terms:</span>{" "}
                <span className="font-bold text-slate-800">Upon Completion</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
            <table className="w-full min-w-[460px] text-left">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700">
                <tr>
                  <th className="p-2.5 sm:p-3">Description</th>
                  <th className="p-2.5 sm:p-3 text-center w-14">Qty</th>
                  <th className="p-2.5 sm:p-3 text-right w-24 sm:w-28">Rate (₦)</th>
                  <th className="p-2.5 sm:p-3 text-right w-28 sm:w-32">Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 sm:p-3 font-medium text-slate-800">{it.desc}</td>
                    <td className="p-2.5 sm:p-3 text-center text-slate-600">{it.qty}</td>
                    <td className="p-2.5 sm:p-3 text-right text-slate-600 font-mono">{(it.rate || 0).toLocaleString()}</td>
                    <td className="p-2.5 sm:p-3 text-right font-bold text-slate-900 font-mono">
                      {((it.qty || 0) * (it.rate || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Settlement Details & Total Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Wire Instructions</span>
              <p className="font-bold text-slate-900">{bankName}</p>
              <p className="font-mono text-sm font-black text-slate-900">{acctNum}</p>
              <p className="text-slate-600">Account Name: {acctName}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-mono font-bold">₦{subtotal.toLocaleString()}</span>
              </div>
              {applyVat && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">VAT (7.5%):</span>
                  <span className="font-mono font-bold">₦{Math.round(vatAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center gap-2 text-sm">
                <span className="font-black text-slate-900 uppercase whitespace-nowrap">Total Due:</span>
                <span className="font-black text-base text-[#0D9488] font-mono whitespace-nowrap">
                  ₦{Math.round(grandTotal).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
