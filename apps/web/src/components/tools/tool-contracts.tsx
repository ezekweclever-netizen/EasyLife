"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

type ContractKey = "service-contract" | "nda" | "demand-letter" | "tenancy-notice" | "equipment-hire";

interface ContractConfig {
  name: string;
  badge: string;
  partyALabel: string;
  partyBLabel: string;
  contentGenerator: (data: any) => string;
}

const CONTRACTS: Record<ContractKey, ContractConfig> = {
  "service-contract": {
    name: "Artisan & Contractor Service Agreement",
    badge: "Commercial Contract",
    partyALabel: "Client / Principal Name",
    partyBLabel: "Artisan / Contractor Business Name",
    contentGenerator: (d) => `THIS SERVICE AGREEMENT is entered into on this ${d.date}, by and between:

1. ${d.partyA} (hereinafter referred to as the "CLIENT"), and
2. ${d.partyB} (hereinafter referred to as the "CONTRACTOR").

WHEREAS the Client desires to retain the Contractor to perform specific technical services, and the Contractor agrees to deliver such services in accordance with the terms herein:

1. SCOPE OF ENGAGEMENT
The Contractor shall furnish all necessary labor, tools, and technical supervision required to execute: ${d.scope || "General technical installation, diagnostics, and repairs"}.

2. CONSIDERATION & PAYMENT MILESTONES
The total agreed contract sum for the complete execution of the works is ₦${parseFloat(d.amount || 0).toLocaleString()} (Naira).
- Initial Deposit / Mobilization: 60% upon site commencement.
- Final Balance: 40% payable upon satisfactory completion, inspection, and testing.

3. DEFECT LIABILITY & WARRANTY PERIOD
The Contractor guarantees all workmanship against technical failure or poor installation for a minimum period of thirty (30) days from handover. Any verified defects arising during this window shall be rectified at zero additional cost to the Client within 48 hours.

4. SAFETY & CONDUCT
The Contractor shall observe all standard safety protocols and OSHA guidelines, ensuring site safety, clean disposal of debris, and respectful conduct.

5. GOVERNING LAW & JURISDICTION
This Agreement shall be construed and enforced under the laws of ${d.state || "Rivers"} State, Federal Republic of Nigeria.`,
  },
  nda: {
    name: "Mutual Non-Disclosure Agreement (NDA)",
    badge: "Confidentiality",
    partyALabel: "Disclosing Party",
    partyBLabel: "Receiving Party",
    contentGenerator: (d) => `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

Dated: ${d.date}
Between: ${d.partyA} AND ${d.partyB}

WHEREAS the parties wish to explore a business opportunity concerning ${d.scope || "Proprietary Commercial Projects"}, and will disclose confidential information:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" includes all technical data, trade secrets, software source code, customer lists, financial models, pricing structures, and business methods disclosed orally or in writing.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party shall hold all Confidential Information in strict confidence and shall not disclose it to any third party without prior written consent.

3. EXCLUSIONS
Information that is publicly known without breach of this Agreement, or already known to the Recipient prior to disclosure, is excluded.

4. TERM & DURATION
This confidentiality obligation shall remain legally binding for two (2) years from the effective date.

5. JURISDICTION
Enforceable under the Laws of the Federal Republic of Nigeria.`,
  },
  "demand-letter": {
    name: "Formal Demand Letter for Overdue Payment",
    badge: "Debt Recovery",
    partyALabel: "Creditor / Claimant Name",
    partyBLabel: "Debtor / Client Name",
    contentGenerator: (d) => `FORMAL DEMAND FOR OVERDUE PAYMENT (FINAL NOTICE BEFORE LEGAL RECOVERY)

Date: ${d.date}
To: ${d.partyB}

DEMAND FOR IMMEDIATE LIQUIDATION OF OUTSTANDING DEBT: ₦${parseFloat(d.amount || 0).toLocaleString()}

TAKE NOTICE that you remain indebted to ${d.partyA} in the sum of ₦${parseFloat(d.amount || 0).toLocaleString()} (Naira) in respect of services rendered on: ${d.scope || "Completed technical contract"}.

Despite repeated reminders and invoice submissions, this sum remains unpaid past the agreed credit maturity date.

YOU ARE HEREBY GIVEN SEVEN (7) BUSINESS DAYS from the date of receipt of this notice to remit the full outstanding balance of ₦${parseFloat(d.amount || 0).toLocaleString()} into the designated bank settlement account.

FAILURE TO COMPLY will leave us with no alternative than to instruct our legal counsel to commence formal debt recovery proceedings in the High Court / Magistrate Court, claiming the principal debt, statutory post-judgment interest at 10% per annum, and all legal costs.

Kindly govern yourself accordingly.`,
  },
  "tenancy-notice": {
    name: "Notice to Quit (Tenancy)",
    badge: "Property Legal",
    partyALabel: "Landlord / Authorized Attorney",
    partyBLabel: "Tenant Name",
    contentGenerator: (d) => `STATUTORY NOTICE TO QUIT (PURSUANT TO RECOVERY OF PREMISES LAW)

Date: ${d.date}
To: ${d.partyB} (Tenant)
Premises: ${d.scope || "Apartment / Commercial Property"}

TAKE NOTICE that I, ${d.partyA}, hereby give you notice to quit and deliver up possession of the premises with the appurtenances situate at ${d.scope || "the aforementioned property"} which you hold of me as Tenant, on or before thirty (30) days from this date.

DATED THIS ${d.date}.

Issued by: ${d.partyA} (Landlord / Lawful Attorney)
Witness: EasyLife Verified Documentation Service`,
  },
  "equipment-hire": {
    name: "Equipment & Generator Hire Agreement",
    badge: "Equipment Rental",
    partyALabel: "Equipment Owner / Hirer",
    partyBLabel: "Customer / Renter Name",
    contentGenerator: (d) => `EQUIPMENT HIRE & BAILMENT AGREEMENT

Effective Date: ${d.date}
Owner: ${d.partyA}
Hirer: ${d.partyB}

1. EQUIPMENT DESCRIPTION: ${d.scope || "Heavy-duty Industrial Generator / Equipment"}
2. HIRE RATE: ₦${parseFloat(d.amount || 0).toLocaleString()} per day.
3. FUEL & CONSUMABLES: All fuel (diesel/petrol) and lubricating oil top-ups during the hire period shall be supplied at the sole cost of the Hirer.
4. DAMAGE & INDEMNITY: The Hirer agrees to indemnify the Owner for any physical damage, loss, or operator negligence during custody.
5. RETURN CONDITION: The equipment shall be returned in clean, fully functional operating condition.`,
  },
};

export function ToolContracts() {
  const [contractType, setContractType] = useState<ContractKey>("service-contract");
  const [partyA, setPartyA] = useState("Chief Emmanuel Briggs");
  const [partyB, setPartyB] = useState("DeltaSpark Electricals & Solar Ltd");
  const [date, setDate] = useState("2026-11-24");
  const [amount, setAmount] = useState("1200000");
  const [scope, setScope] = useState("Supply and installation of 5kVA hybrid solar system and complete wiring");
  const [state, setState] = useState("Rivers");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const activeConf = CONTRACTS[contractType] || CONTRACTS["service-contract"]!;
  const generatedText = activeConf.contentGenerator({
    partyA,
    partyB,
    date,
    amount,
    scope,
    state,
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Legal Instruments &amp; Compliance
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Nigerian Legal Contracts &amp; Document Templates
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Fill out and export vetted Nigerian agreements: Service Contract, Mutual NDA, Overdue Payment Demand, and Tenancy Notice.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#071526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Template Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(CONTRACTS) as ContractKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setContractType(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                contractType === k
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "bg-white dark:bg-[#0D223A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {CONTRACTS[k]?.name}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">{activeConf.partyALabel}</label>
            <input
              type="text"
              value={partyA}
              onChange={(e) => setPartyA(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] font-bold"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">{activeConf.partyBLabel}</label>
            <input
              type="text"
              value={partyB}
              onChange={(e) => setPartyB(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Contract Consideration / Sum (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] font-mono"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Effective Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold mb-1">Specific Scope of Works / Subject Matter</label>
            <input
              type="text"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A]"
            />
          </div>
        </div>

        {/* Live Draft Preview Box */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Live Agreement Instrument Preview
          </span>
          <pre className="p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
            {generatedText}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Binding Legal Document</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={activeConf.name}
        badge={activeConf.badge}
        filename={`${contractType}.pdf`}
        summaryText={`Legal Document: ${activeConf.name}\nParties: ${partyA} & ${partyB}\nDate: ${date}\nJurisdiction: ${state} State, Nigeria`}
      >
        <div className="space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-wider">
              Legal Instrument &amp; Binding Agreement
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
              {activeConf.name}
            </h1>
          </div>

          <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-xs sm:text-sm">
            {generatedText}
          </div>

          {/* Signature Seals */}
          <div className="border-t border-slate-300 pt-8 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-1">
              <div className="w-48 border-b border-slate-500 mb-1" />
              <p className="font-black text-slate-900">{partyA}</p>
              <p className="text-[11px] text-slate-500">Party of the First Part (Signature &amp; Date)</p>
            </div>
            <div className="space-y-1 text-right">
              <div className="w-48 border-b border-slate-500 mb-1 ml-auto" />
              <p className="font-black text-slate-900">{partyB}</p>
              <p className="text-[11px] text-slate-500">Party of the Second Part (Signature &amp; Date)</p>
            </div>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
