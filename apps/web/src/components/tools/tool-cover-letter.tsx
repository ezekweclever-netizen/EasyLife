"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

export function ToolCoverLetter() {
  const [applicantName, setApplicantName] = useState("Babajide Chukwuma Adeleke");
  const [applicantPhone, setApplicantPhone] = useState("+234 803 765 4321");
  const [applicantEmail, setApplicantEmail] = useState("b.adeleke@easylife-pro.ng");
  const [applicantAddress, setApplicantAddress] = useState("Trans-Amadi Industrial Layout, Port Harcourt");

  const [recipientName, setRecipientName] = useState("Engr. Tamuno Briggs");
  const [recipientTitle, setRecipientTitle] = useState("Head of Facility Operations");
  const [companyName, setCompanyName] = useState("Niger Delta Logistics & Terminals Ltd");
  const [companyAddress, setCompanyAddress] = useState("Plot 5 Marine Base Road, Port Harcourt");

  const [jobTitle, setJobTitle] = useState("Senior Facilities & Power Systems Maintenance Lead");
  const [letterDate, setLetterDate] = useState("2026-11-24");

  const [openingPara, setOpeningPara] = useState(
    "I am writing to formally submit my application for the Senior Facilities & Power Systems Maintenance Lead position currently open at Niger Delta Logistics & Terminals Ltd. Having followed your recent expansion across marine freight terminals, I am confident that my 7+ years of hands-on leadership in heavy-duty generator synchronization, solar PV hybrid installations, and preventative facility maintenance directly matches the technical rigor required for this role."
  );

  const [bodyPara1, setBodyPara1] = useState(
    "In my recent role at Apex Oilfield Services, I was directly accountable for 24/7 electrical continuity across a 45-acre operating terminal powered by Cummins 500kVA generator clusters and hybrid solar arrays. Through rigorous ATS logic optimization and preventive thermal imaging audits, I slashed unexpected facility downtime to near zero while reducing diesel expenditure by 28% in 18 months. My experience managing certified artisan teams ensures both OSHA-grade safety compliance and high technical speed under high-pressure operating environments."
  );

  const [bodyPara2, setBodyPara2] = useState(
    "What excites me most about joining your engineering team is your unwavering commitment to operational excellence and sustainability in the Niger Delta. I bring not only a deep mastery of complex industrial three-phase distribution and automated load shedding, but also strong vendor negotiation skills and an accountable, proactive mindset that protects critical company assets."
  );

  const [closingPara, setClosingPara] = useState(
    "Thank you for your time and consideration of my candidacy. I welcome the opportunity to discuss in an interview how my technical leadership and operational reliability will deliver immediate value to Niger Delta Logistics & Terminals Ltd."
  );

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#E8590C] dark:text-[#F06A1F] uppercase tracking-wider">
          Job Applications &amp; Career
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Professional Cover Letter Builder
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Generate tailored, compelling Nigerian job application cover letters with formal letterhead styling and PDF export.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#1F2328] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Applicant Info */}
          <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-bold text-[#E8590C] uppercase tracking-wider block">
              1. Your Contact Information
            </span>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-bold"
            />
            <input
              type="text"
              value={applicantAddress}
              onChange={(e) => setApplicantAddress(e.target.value)}
              placeholder="Your Address / City"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="Phone Number"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
              <input
                type="email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
          </div>

          {/* Employer Info */}
          <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider block">
              2. Employer &amp; Target Role
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Hiring Manager Name"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-bold"
              />
              <input
                type="text"
                value={recipientTitle}
                onChange={(e) => setRecipientTitle(e.target.value)}
                placeholder="Hiring Manager Title"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-bold"
            />
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Target Job Title"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-[#E8590C] font-bold"
            />
          </div>
        </div>

        {/* Paragraphs Editing */}
        <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <span className="font-bold text-[#E8590C] uppercase tracking-wider block">
            3. Letter Narrative &amp; Arguments
          </span>

          <div>
            <label className="block text-slate-500 mb-1">Opening Paragraph (Purpose &amp; Alignment)</label>
            <textarea
              value={openingPara}
              onChange={(e) => setOpeningPara(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Body Paragraph 1 (Direct Technical Experience &amp; Quantified Metrics)</label>
            <textarea
              value={bodyPara1}
              onChange={(e) => setBodyPara1(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Body Paragraph 2 (Strategic Value &amp; Fit)</label>
            <textarea
              value={bodyPara2}
              onChange={(e) => setBodyPara2(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">Closing &amp; Call to Action</label>
            <textarea
              value={closingPara}
              onChange={(e) => setClosingPara(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs leading-relaxed"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Application Cover Letter</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Cover Letter — ${jobTitle}`}
        badge="Job Application"
        filename={`cover-letter-${jobTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
        summaryText={`Formal Cover Letter\nApplicant: ${applicantName}\nApplying For: ${jobTitle}\nEmployer: ${companyName}\nDate: ${letterDate}`}
      >
        <div className="space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
          {/* Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5">
            <h1 className="text-2xl font-black text-slate-900">{applicantName}</h1>
            <p className="text-xs text-slate-600 mt-1">
              {applicantAddress} • {applicantPhone} • {applicantEmail}
            </p>
          </div>

          {/* Date & Recipient */}
          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-700">{letterDate}</p>
            <div className="pt-2">
              <p className="font-bold text-slate-900">{recipientName}</p>
              <p className="text-slate-600">{recipientTitle}</p>
              <p className="font-semibold text-slate-800">{companyName}</p>
              <p className="text-slate-500">{companyAddress}</p>
            </div>
          </div>

          {/* Subject Line */}
          <div className="pt-2">
            <p className="font-black text-sm uppercase text-slate-900 border-b border-slate-300 pb-1 inline-block">
              RE: APPLICATION FOR {jobTitle.toUpperCase()}
            </p>
          </div>

          <p>Dear {recipientName || "Hiring Manager"},</p>

          <p>{openingPara}</p>
          <p>{bodyPara1}</p>
          <p>{bodyPara2}</p>
          <p>{closingPara}</p>

          {/* Signoff */}
          <div className="pt-4 space-y-4">
            <p>Sincerely,</p>
            <div className="space-y-1">
              <p className="font-black text-slate-900 text-sm">{applicantName}</p>
              <p className="text-slate-500 text-xs">{applicantPhone}</p>
            </div>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
