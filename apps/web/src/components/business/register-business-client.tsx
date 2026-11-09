"use client";

import { useState, useTransition } from "react";
import { createBusinessAccountAction } from "@/app/actions/business";

export function RegisterBusinessClient() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createBusinessAccountAction(formData);
      setFeedback(res);
      if (res.ok) {
        window.location.reload();
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center max-w-md mx-auto mb-8">
          <span className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            EL
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Your Business Account
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Centralise facility maintenance, track equipment lifecycles, dispatch technicians, and manage multiple property locations on EasyLife.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl mb-6 text-xs font-semibold ${
              feedback.ok
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization / Company Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Niger Delta Logistics Ltd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Portal Handle / Slug *
              </label>
              <input
                type="text"
                name="slug"
                required
                placeholder="e.g. nd-logistics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Business Email *
              </label>
              <input
                type="email"
                name="contactEmail"
                required
                placeholder="facilities@ndlogistics.ng"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                name="contactPhone"
                placeholder="+234 803 000 0000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry / Sector
              </label>
              <select
                name="industry"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="Real Estate & Property Management">Real Estate & Property Management</option>
                <option value="Oil & Gas / Energy">Oil & Gas / Energy</option>
                <option value="Hospitality & Hotels">Hospitality & Hotels</option>
                <option value="Commercial Banking & Finance">Commercial Banking & Finance</option>
                <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
                <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                <option value="Retail & Supermarkets">Retail & Supermarkets</option>
                <option value="Other">Other Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CAC Registration Number (Optional)
              </label>
              <input
                type="text"
                name="registrationNumber"
                placeholder="RC-1928374"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Primary Business Location
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="e.g. Plot 12 Stadium Road, GRA Phase 4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  defaultValue="Port Harcourt"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  defaultValue="Rivers State"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-6 py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md transition disabled:opacity-50"
          >
            {isPending ? "Creating Business Account..." : "Create Business Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
