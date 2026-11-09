"use client";

import Link from "next/link";
import { formatMinorUnits } from "@easylife/shared-types";
import type { BusinessDashboardMetrics } from "@easylife/shared-types";

interface BusinessDashboardClientProps {
  business: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  metrics: BusinessDashboardMetrics;
}

export function BusinessDashboardClient({
  business,
  metrics,
}: BusinessDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3">
              Corporate & Property Maintenance Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {business.name} Maintenance Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Centralised facility oversight across {business.city}, {business.state}.
              Monitor equipment health, manage repairs, track service intervals, and control costs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/business/maintenance?action=report-fault"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition"
            >
              <span>⚡</span> Report Fault
            </Link>
            <Link
              href="/business/assets?action=add-asset"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <span>+</span> Add Equipment
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue Warning Alert if any */}
      {metrics.overdue_maintenance > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h3 className="font-bold text-sm">
              {metrics.overdue_maintenance} Maintenance Schedule{metrics.overdue_maintenance > 1 ? "s" : ""} Overdue
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Equipment service dates have passed. Timely maintenance prevents operational downtime and expensive emergency repairs.
            </p>
            <Link
              href="/business/schedules?filter=overdue"
              className="inline-block mt-2 text-xs font-bold text-amber-900 underline hover:text-amber-950"
            >
              View Overdue Schedules →
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Properties */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Properties</span>
            <span className="text-base">🏢</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.total_properties}</div>
          <div className="text-xs text-slate-500 mt-1">Managed sites</div>
        </div>

        {/* Registered Assets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Assets</span>
            <span className="text-base">⚙️</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.registered_assets}</div>
          <div className="text-xs text-slate-500 mt-1">Equipment items</div>
        </div>

        {/* Open Requests */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open Faults</span>
            <span className="text-base">🛠️</span>
          </div>
          <div className="text-2xl font-black text-teal-800">{metrics.open_maintenance_requests}</div>
          <div className="text-xs text-slate-500 mt-1">Active jobs</div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming</span>
            <span className="text-base">📅</span>
          </div>
          <div className="text-2xl font-black text-indigo-800">{metrics.upcoming_maintenance}</div>
          <div className="text-xs text-slate-500 mt-1">Due in 30 days</div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue</span>
            <span className="text-base">⏰</span>
          </div>
          <div className={`text-2xl font-black ${metrics.overdue_maintenance > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {metrics.overdue_maintenance}
          </div>
          <div className="text-xs text-slate-500 mt-1">Requires attention</div>
        </div>

        {/* Expenditure */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expenditure</span>
            <span className="text-base">💳</span>
          </div>
          <div className="text-lg font-black text-slate-900 truncate" title={formatMinorUnits(metrics.total_expenditure_kobo)}>
            {formatMinorUnits(metrics.total_expenditure_kobo)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total maintenance</div>
        </div>
      </div>

      {/* Main Content Layout: Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Recent Maintenance Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Audit log of repairs, preventive servicing, and fault tickets</p>
            </div>
            <Link
              href="/business/maintenance"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
            >
              View Full History →
            </Link>
          </div>

          {metrics.recent_activities.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-lg">
              <span className="text-3xl block mb-2">📋</span>
              <p className="text-sm font-semibold text-slate-700">No maintenance activity recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Report equipment faults or schedule regular preventive maintenance to populate your activity log.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.recent_activities.map((act) => (
                <div key={act.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      act.activity_type === "record"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {act.activity_type === "record" ? "✓" : "!"}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-tight">
                        {act.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{act.property_name}</span>
                        {act.asset_name && act.asset_name !== "General Property" && (
                          <span> • <span className="text-teal-700 font-medium">{act.asset_name}</span></span>
                        )}
                        <span> • {new Date(act.activity_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wider ${
                      act.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : act.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : act.status === "scheduled"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {act.status}
                    </span>
                    {act.cost_kobo > 0 && (
                      <div className="text-xs font-semibold text-slate-700 mt-1">
                        {formatMinorUnits(act.cost_kobo)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Management Shortcuts */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
            <h2 className="text-base font-extrabold text-slate-900 mb-4">Management Modules</h2>
            <div className="space-y-3">
              <Link
                href="/business/properties"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏢</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-teal-800">
                      Properties & Units
                    </div>
                    <div className="text-xs text-slate-500">
                      Manage locations, addresses, and property managers
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700">→</span>
              </Link>

              <Link
                href="/business/assets"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-teal-800">
                      Equipment Registry
                    </div>
                    <div className="text-xs text-slate-500">
                      Air conditioners, generators, inverters & solar
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700">→</span>
              </Link>

              <Link
                href="/business/schedules"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-teal-800">
                      Maintenance Schedules
                    </div>
                    <div className="text-xs text-slate-500">
                      Upcoming & overdue servicing reminders
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700">→</span>
              </Link>

              <Link
                href="/business/team"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">👥</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-teal-800">
                      Team & Permissions
                    </div>
                    <div className="text-xs text-slate-500">
                      Invite facility managers, technicians & viewers
                    </div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-teal-700">→</span>
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>🛡️</span> Service Accountability Guarantee
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              All repairs booked through EasyLife are protected by escrow, pro verification, completion photo sign-offs, and formal dispute investigation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
