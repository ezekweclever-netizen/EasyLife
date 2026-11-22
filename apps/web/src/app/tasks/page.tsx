import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import { PageHero } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Everyday Tasks & Errand Assistance — EasyLife Nigeria",
  description:
    "Post general tasks, custom household errands, furniture assembly, or specialized chores that do not fit standard categories. Receive competitive quotations from vetted local professionals.",
};

export default function EverydayTasksPage() {
  return (
    <PublicShell>
      <PageHero
        badge="Everyday Problems. Smarter Solutions."
        title="Post Any Everyday Task or Errand"
        description="Need something done that doesn't fit standard trade boxes? Post your task details, specify your budget and schedule, and let vetted professionals send you transparent quotations."
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Core Workflow Card */}
        <div className="bg-white dark:bg-[#0D223A] rounded-3xl border border-slate-200 dark:border-[#163654] p-6 sm:p-10 shadow-lg space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              How Everyday Tasks Work on EasyLife
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Your payments remain protected in secure escrow until you inspect and confirm completion of the task.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-[#071526] rounded-2xl p-5 space-y-2 text-center border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-black flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Describe Your Task</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Tell us what you need done, upload photos/videos if helpful, set your preferred date, time, and address.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#071526] rounded-2xl p-5 space-y-2 text-center border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-black flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Receive Itemized Quotes</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Suitable local professionals review your request, ask questions via messaging, and submit transparent quotes.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#071526] rounded-2xl p-5 space-y-2 text-center border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-[#0D9488]/10 text-[#0D9488] font-black flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Escrow-Protected Release</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Accept a quote to fund escrow. When the job is done to your satisfaction, confirm completion to release payment.
              </p>
            </div>
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/book?cat=everyday-tasks"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-sm shadow-md transition"
            >
              Post an Everyday Task Now →
            </Link>
          </div>
        </div>

        {/* Popular Task Types Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white text-center sm:text-left">
            Common Everyday Tasks Handled by EasyLife Providers
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {[
              "Furniture & Shelving Assembly",
              "Curtain Rail & Blinds Mounting",
              "Compound Weeding & Yard Tidy-Up",
              "Heavy Luggage Moving & Loading",
              "Store Room Organization",
              "Pre-Event Hall Arrangement",
              "Door Handle & Hinge Replacement",
              "Window Mesh & Mosquito Net Fitting",
            ].map((task, idx) => (
              <Link
                key={idx}
                href={`/book?cat=everyday-tasks&desc=${encodeURIComponent(task)}`}
                className="bg-white dark:bg-[#0D223A] rounded-xl border border-slate-200 dark:border-[#163654] p-3 hover:border-[#0D9488] hover:shadow-xs transition font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between"
              >
                <span>{task}</span>
                <span className="text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
