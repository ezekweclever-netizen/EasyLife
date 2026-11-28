"use client";

import React, { useState } from "react";
import { DocumentPreviewModal } from "./document-preview-modal";

interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  city: string;
  period: string;
  bullets: string[];
}

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export function ToolCvBuilder() {
  const [template, setTemplate] = useState<"executive" | "minimal" | "technical">("executive");

  // Personal
  const [fullName, setFullName] = useState("Babajide Chukwuma Adeleke");
  const [title, setTitle] = useState("Senior Facilities & Electrical Systems Specialist");
  const [phone, setPhone] = useState("+234 803 765 4321");
  const [email, setEmail] = useState("b.adeleke@easylife-pro.ng");
  const [cityState, setCityState] = useState("Port Harcourt, Rivers State");

  // Summary
  const [summary, setSummary] = useState(
    "Results-driven electrical and facility engineering professional with 7+ years of expertise managing commercial generator power plants, 10kVA+ hybrid solar installations, and low-voltage distribution networks. Proven track record leading multidisciplinary maintenance crews, slashing diesel consumption by 28%, and delivering zero-downtime preventative protocols for enterprise facilities."
  );

  // Experience
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      id: "1",
      role: "Lead Electrical & Power Systems Engineer",
      company: "Apex Oilfield Services & Logistics",
      city: "Trans-Amadi, Port Harcourt",
      period: "2022 — Present",
      bullets: [
        "Direct 24/7 power continuity for a 45-acre logistics yard running synchronized 500kVA Cummins diesel generators and 30kW solar PV array.",
        "Engineered automatic transfer switch (ATS) logic that reduced generator changeover latency from 3 minutes to under 8 seconds.",
        "Supervise a field team of 6 electrical artisans, achieving 99.4% uptime across cold-room storage and warehouse operations.",
      ],
    },
    {
      id: "2",
      role: "Maintenance Technician & Solar Installer",
      company: "Solaria Energy Systems Nigeria",
      city: "Ikeja, Lagos",
      period: "2019 — 2022",
      bullets: [
        "Commissioned over 60 residential and SME lithium-ion and tubular inverter battery setups ranging from 3.5kVA to 15kVA.",
        "Conducted thermal camera audits on electrical distribution boards, eliminating critical busbar hot spots and fire hazards.",
      ],
    },
  ]);

  // Education
  const [educations, setEducations] = useState<EducationItem[]>([
    {
      id: "1",
      institution: "Rivers State University (RSU), Port Harcourt",
      degree: "B.Tech in Electrical / Electronic Engineering",
      year: "2018",
    },
    {
      id: "2",
      institution: "Federal Ministry of Labour & Employment",
      degree: "Trade Test Certificate (Grade 1 — Electrical Installation)",
      year: "2019",
    },
  ]);

  // Skills
  const [skills, setSkills] = useState(
    "Hybrid Solar Inverter Design, Cummins & Perkins Diesel Servicing, ATS Synchronization, Three-Phase DB Balancing, CAD Single-Line Schematics, Safety & OSHA Compliance"
  );

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Experience helpers
  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        role: "Maintenance Engineer / Technician",
        company: "Company / Contractor Name",
        city: "City, State",
        period: "2020 — 2022",
        bullets: ["Spearheaded electrical troubleshooting and preventative facility upkeep."],
      },
    ]);
  };

  const removeExperience = (id: string) => {
    if (experiences.length <= 1) return;
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  const updateExperience = (id: string, field: keyof ExperienceItem, val: any) => {
    setExperiences(
      experiences.map((e) => {
        if (e.id !== id) return e;
        return { ...e, [field]: val };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold text-[#E8590C] dark:text-[#F06A1F] uppercase tracking-wider">
          Career Development &amp; Artisans
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
          Professional CV &amp; Resume Builder
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
          Build application-ready Nigerian curriculum vitae with structured experience bullets, technical certifications, and PDF export.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-[#1F2328] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Template Selector */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500">Template Style:</span>
            <button
              type="button"
              onClick={() => setTemplate("executive")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                template === "executive"
                  ? "bg-[#E8590C] text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              Executive Clean
            </button>
            <button
              type="button"
              onClick={() => setTemplate("technical")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                template === "technical"
                  ? "bg-[#E8590C] text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              Technical / Artisan Pro
            </button>
            <button
              type="button"
              onClick={() => setTemplate("minimal")}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                template === "minimal"
                  ? "bg-[#E8590C] text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              Modern Minimalist
            </button>
          </div>
        </div>

        {/* Personal Details */}
        <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <span className="font-bold text-[#E8590C] uppercase tracking-wider block">
            1. Personal &amp; Contact Header
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-bold"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Professional Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold mb-1">Location / State</label>
              <input
                type="text"
                value={cityState}
                onChange={(e) => setCityState(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
              />
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <span className="font-bold text-[#E8590C] uppercase tracking-wider block">
            2. Professional Summary
          </span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs leading-relaxed"
          />
        </div>

        {/* Employment History */}
        <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#E8590C] uppercase tracking-wider">
              3. Work Experience &amp; Projects
            </span>
            <button
              type="button"
              onClick={addExperience}
              className="px-3 py-1 rounded bg-[#E8590C] text-white text-[11px] font-bold hover:bg-[#0B7A6F] cursor-pointer"
            >
              + Add Experience
            </button>
          </div>

          <div className="space-y-4">
            {experiences.map((exp, idx) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1F2328] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Role #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                    placeholder="Job Title / Role"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] font-bold"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                    placeholder="Company / Employer"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
                  />
                  <input
                    type="text"
                    value={exp.city}
                    onChange={(e) => updateExperience(exp.id, "city", e.target.value)}
                    placeholder="Location"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
                  />
                  <input
                    type="text"
                    value={exp.period}
                    onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                    placeholder="Duration (e.g. 2021 — Present)"
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Key Achievements / Responsibilities (One per line)
                  </label>
                  <textarea
                    value={exp.bullets.join("\n")}
                    onChange={(e) =>
                      updateExperience(
                        exp.id,
                        "bullets",
                        e.target.value.split("\n").filter((b) => b.trim().length > 0)
                      )
                    }
                    rows={3}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Skills */}
        <div className="p-4 bg-white dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <span className="font-bold text-[#E8590C] uppercase tracking-wider block">
            4. Core Skills &amp; Competencies
          </span>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1F2328] text-xs"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#0B7A6F] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>👁️ View Application-Ready CV Document</span>
          </button>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Curriculum Vitae — ${fullName}`}
        badge="Application CV"
        filename={`cv-${fullName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`}
        summaryText={`Curriculum Vitae: ${fullName}\nTitle: ${title}\nPhone: ${phone}\nEmail: ${email}\nLocation: ${cityState}\nCore Competencies: ${skills}`}
      >
        <div className="space-y-6 text-slate-800">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{fullName}</h1>
            <p className="text-sm font-bold text-[#E8590C] mt-1">{title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
              <span>📞 {phone}</span>
              <span>✉️ {email}</span>
              <span>📍 {cityState}</span>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-200 pb-1 mb-2">
              Professional Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
          </div>

          {/* Work Experience */}
          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-200 pb-1 mb-3">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-black text-slate-900">{exp.role}</h3>
                    <span className="text-[11px] font-bold text-slate-500">{exp.period}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#E8590C] font-semibold">
                    <span>{exp.company}</span>
                    <span className="text-slate-400">{exp.city}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pt-1">
                    {exp.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education & Credentials */}
          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-200 pb-1 mb-2">
              Education &amp; Professional Certifications
            </h2>
            <div className="space-y-2">
              {educations.map((edu) => (
                <div key={edu.id} className="flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>
                    <span className="text-slate-500 block text-[11px]">{edu.institution}</span>
                  </div>
                  <span className="font-bold text-slate-600">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-200 pb-1 mb-2">
              Technical &amp; Operational Proficiencies
            </h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {skills.split(",").map((sk, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-100 rounded text-slate-800 text-[11px] font-medium border border-slate-200"
                >
                  {sk.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DocumentPreviewModal>
    </div>
  );
}
