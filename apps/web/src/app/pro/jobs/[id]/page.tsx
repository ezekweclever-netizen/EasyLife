import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getProfessionalProfile,
  getProJobById,
} from "@/lib/supabase/pro";
import { JobStatusActions } from "@/components/pro/job-status-actions";

export const metadata: Metadata = {
  title: "Service Request Details — EasyLife Pro",
  description: "Review service request details, prepare quotation, or manage job execution.",
};

interface ProJobDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProJobDetailsPage({ params }: ProJobDetailsPageProps) {
  const { id } = await params;
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect(`/login?next=/pro/jobs/${id}`);
  }

  const profile = await getProfessionalProfile(auth.user.id, auth.accessToken);
  if (!profile) {
    redirect("/pro/register");
  }

  const job = await getProJobById(id, profile.id, auth.accessToken);
  if (!job) {
    notFound();
  }

  const isAssigned = job.is_assigned_to_pro;
  const isAcceptedOrBeyond = [
    "accepted",
    "confirmed",
    "scheduled",
    "in_progress",
    "pro_marked_complete",
    "completed",
  ].includes(job.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link & Header */}
      <div>
        <Link
          href="/pro/jobs"
          className="text-xs font-semibold text-[#0D9488] hover:underline inline-flex items-center gap-1 mb-2"
        >
          ← Back to Job Requests
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-slate-500">
                {job.reference_code}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  job.status === "completed"
                    ? "bg-emerald-100 text-emerald-800"
                    : job.status === "in_progress"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {job.status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {job.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/pro/messages?bookingRef=${job.reference_code}`}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              💬 Message Customer
            </Link>
          </div>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Category & Urgency */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="block text-slate-500 font-medium">Category</span>
            <span className="block font-bold text-slate-900 mt-0.5">
              {job.category?.name || "Service Request"}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 font-medium">Urgency</span>
            <span className="block font-bold text-slate-900 mt-0.5 capitalize">
              {job.urgency}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 font-medium">Preferred Date</span>
            <span className="block font-bold text-slate-900 mt-0.5">
              {job.preferred_date || "Flexible"}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 font-medium">Preferred Time</span>
            <span className="block font-bold text-slate-900 mt-0.5">
              {job.preferred_time_slot || "Anytime"}
            </span>
          </div>
        </div>

        {/* Customer Problem Description */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Customer Problem Description
          </h2>
          <div className="p-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </div>
        </div>

        {/* Location & Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Service Location
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <p className="font-semibold text-slate-900">
                {job.service_address}
              </p>
              <p className="text-slate-500">
                {job.lga_or_district ? `${job.lga_or_district}, ` : ""}
                {job.city}, {job.state}
              </p>
              {!isAssigned && (
                <p className="text-[11px] text-amber-700 font-medium mt-1">
                  🔒 Exact building number and street protected by NDPA privacy until quotation is accepted.
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Customer Contact Information
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <p className="font-semibold text-slate-900">
                {job.customer_display_name}
              </p>
              <p className="text-slate-500">
                Phone: {job.customer_phone_masked}
              </p>
              {isAcceptedOrBeyond && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  ✓ Booking confirmed. Escrow secured.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Confirmed Appointment Notification Banner */}
        {job.scheduled_start_at && ["confirmed", "scheduled", "in_progress", "completed"].includes(job.status) && (
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-teal-950 block">
                ✓ Confirmed Appointment Window
              </span>
              <p className="text-teal-800">
                Scheduled for {new Date(job.scheduled_start_at).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {new Date(job.scheduled_start_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                {job.scheduled_end_at && ` – ${new Date(job.scheduled_end_at).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#0D9488] text-white uppercase tracking-wider self-start sm:self-auto">
              Locked in Calendar
            </span>
          </div>
        )}

        {/* Agreed Financials if assigned */}
        {job.agreed_amount_kobo && (
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700">
                Agreed Escrow Job Value
              </span>
              <p className="text-[11px] text-teal-800">
                Locked securely in EasyLife Escrow. Transferred to wallet upon completion sign-off.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#0D9488]">
                ₦{(job.agreed_amount_kobo / 100).toLocaleString("en-NG")}
              </span>
            </div>
          </div>
        )}

        {/* Completion Notes if present */}
        {job.pro_completion_notes && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 block mb-1">
              Pro Completion Handover Notes
            </span>
            <p className="text-xs text-emerald-800 whitespace-pre-wrap">
              {job.pro_completion_notes}
            </p>
          </div>
        )}

        {/* Job Management Controls */}
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Job Execution Controls
          </h3>

          <JobStatusActions
            bookingId={job.id}
            currentStatus={job.status}
            isAssignedToPro={Boolean(isAssigned)}
          />

          {!isAssigned && ["submitted", "open", "pending_pro_response", "quoted"].includes(job.status) && (
            <div className="flex items-center gap-3">
              <Link
                href={`/pro/jobs?quote=${job.id}`}
                className="px-5 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
              >
                Prepare Official Quotation →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
