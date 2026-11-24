"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createJobVacancyAction } from "@/app/actions/jobs";
import { Icon } from "@/components/site/icons";

export function PostVacancyForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electrical & Solar");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [workplaceType, setWorkplaceType] = useState("on_site");
  const [city, setCity] = useState("Port Harcourt");
  const [address, setAddress] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("month");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [positionsAvailable, setPositionsAvailable] = useState("1");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [benefits, setBenefits] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("employmentType", employmentType);
    formData.append("workplaceType", workplaceType);
    formData.append("city", city);
    let state = "Rivers State";
    if (city === "Lagos") state = "Lagos State";
    if (city === "Abuja") state = "Federal Capital Territory";
    formData.append("state", state);
    formData.append("address", address.trim());
    formData.append("minSalaryNaira", minSalary.trim());
    formData.append("maxSalaryNaira", maxSalary.trim());
    formData.append("salaryPeriod", salaryPeriod);
    formData.append("isNegotiable", String(isNegotiable));
    formData.append("description", description.trim());
    formData.append("requirements", requirements.trim());
    formData.append("responsibilities", responsibilities.trim());
    formData.append("positionsAvailable", positionsAvailable);
    if (applicationDeadline)
      formData.append("applicationDeadline", applicationDeadline);
    if (benefits.trim()) formData.append("benefits", benefits.trim());

    try {
      const result = await createJobVacancyAction(
        { status: "idle", message: "" },
        formData
      );

      if (result.status === "success" && (result.slug || result.vacancyId)) {
        router.push(`/jobs/${result.slug || result.vacancyId}`);
      } else {
        setSubmissionError(result.message || "Failed to post job vacancy.");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200/90 dark:border-[#163654] p-6 sm:p-10 shadow-xl space-y-8 max-w-3xl mx-auto">
      <div>
        <span className="text-xs font-bold text-[#0D9488] dark:text-[#5CD3D5] uppercase tracking-wider">
          Employer Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Post a Trade Role or Apprenticeship Vacancy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Reach thousands of certified tradespeople, vocational graduates, and skilled technicians across Port Harcourt, Lagos, and Abuja.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
        {submissionError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs sm:text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>{submissionError}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Vacancy Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Solar Inverter & Battery Storage Technician"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
          {fieldErrors.title && (
            <p className="text-xs text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Category & Employment Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Trade Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="Electrical & Solar">Electrical &amp; Solar</option>
              <option value="AC & Refrigeration">AC &amp; Refrigeration</option>
              <option value="Generator & Mechanical">Generator &amp; Mechanical</option>
              <option value="Plumbing & Water">Plumbing &amp; Water</option>
              <option value="Skilled Trades">Skilled Trades (Carpentry, Painting, Masonry)</option>
              <option value="Apprenticeship & Vocational">Apprenticeship &amp; Vocational</option>
              <option value="Facility Maintenance">Facility Maintenance</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="full_time">Full Time</option>
              <option value="contract">Contract</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="freelance">Freelance / Gig</option>
              <option value="part_time">Part Time</option>
            </select>
          </div>
        </div>

        {/* Pilot City & Workplace Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Operating Pilot City <span className="text-red-500">*</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="Port Harcourt">Port Harcourt (Rivers State)</option>
              <option value="Lagos">Lagos (Lagos State)</option>
              <option value="Abuja">Abuja (Federal Capital Territory)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Workplace Type
            </label>
            <select
              value={workplaceType}
              onChange={(e) => setWorkplaceType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="on_site">On-Site / Field Work</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Address / Landmark */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Workshop, Office or Site Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Plot 14 Peter Odili Road, Trans-Amadi, Port Harcourt"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
        </div>

        {/* Compensation Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Min Salary (₦ Naira)
            </label>
            <input
              type="text"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="e.g. 180,000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            {fieldErrors.minSalaryNaira && (
              <p className="text-xs text-red-600">{fieldErrors.minSalaryNaira}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Max Salary (₦ Naira)
            </label>
            <input
              type="text"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              placeholder="e.g. 250,000"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Payment Period
            </label>
            <select
              value={salaryPeriod}
              onChange={(e) => setSalaryPeriod(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="month">Per Month</option>
              <option value="week">Per Week</option>
              <option value="day">Per Day</option>
              <option value="project">Per Project</option>
            </select>
          </div>
        </div>

        {/* Role Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail the scope of work, types of equipment serviced, work environment, and team setup..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-600">{fieldErrors.description}</p>
          )}
        </div>

        {/* Key Requirements */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Key Requirements &amp; Certifications <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="e.g. 3+ years inverter wiring, valid trade test, valid driver's license..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
          {fieldErrors.requirements && (
            <p className="text-xs text-red-600">{fieldErrors.requirements}</p>
          )}
        </div>

        {/* Benefits & Openings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Benefits / Perks (Comma separated)
            </label>
            <input
              type="text"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="e.g. Health HMO, Tool set provided, Transport stipend"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Positions Available
            </label>
            <input
              type="number"
              min="1"
              value={positionsAvailable}
              onChange={(e) => setPositionsAvailable(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071526] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link
            href="/jobs"
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline"
          >
            &larr; Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing Vacancy...</span>
              </>
            ) : (
              <span>Publish Vacancy Now &rarr;</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
