"use client";

import { useState, useTransition } from "react";
import {
  createMaintenanceRequestAction,
  recordMaintenanceCompletionAction,
} from "@/app/actions/business";
import { formatMinorUnits } from "@easylife/shared-types";
import type {
  FaultSeverityLevel,
  MaintenanceRequestStatus,
} from "@easylife/shared-types";

interface MaintenanceRequestItem {
  id: string;
  business_id: string;
  property_id: string;
  asset_id: string | null;
  title: string;
  description: string;
  fault_severity: FaultSeverityLevel;
  status: MaintenanceRequestStatus;
  scheduled_date: string | null;
  estimated_cost_kobo: number;
  actual_cost_kobo: number;
  photos?: string[] | null;
  created_at: string;
  properties?: { name: string; code: string } | null;
  assets?: { name: string; asset_tag: string } | null;
}

interface MaintenanceRecordItem {
  id: string;
  business_id: string;
  property_id: string;
  asset_id: string | null;
  performed_by_name: string;
  maintenance_type: string;
  summary: string;
  work_performed: string;
  parts_replaced?: string | null;
  cost_kobo: number;
  invoice_number?: string | null;
  invoice_url?: string | null;
  performed_at: string;
}

interface PropertyOption {
  id: string;
  name: string;
  code: string;
}

interface AssetOption {
  id: string;
  name: string;
  asset_tag: string;
  property_id: string;
}

interface MaintenanceManagerClientProps {
  business: {
    id: string;
    name: string;
  };
  properties: PropertyOption[];
  assets: AssetOption[];
  requests: MaintenanceRequestItem[];
  records: MaintenanceRecordItem[];
  initialAction?: string;
  initialPropertyId?: string;
  initialAssetId?: string;
}

export function MaintenanceManagerClient({
  business,
  properties,
  assets,
  requests,
  records,
  initialAction,
  initialPropertyId,
  initialAssetId,
}: MaintenanceManagerClientProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>(initialPropertyId || "all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(initialAction === "report-fault");
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeRequestForCompletion, setActiveRequestForCompletion] = useState<MaintenanceRequestItem | null>(null);

  // Form helpers
  const [selectedPropInForm, setSelectedPropInForm] = useState<string>(
    initialPropertyId || properties[0]?.id || ""
  );
  const [selectedAssetInForm, setSelectedAssetInForm] = useState<string>(initialAssetId || "");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photosList, setPhotosList] = useState<string[]>([]);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesProperty = propertyFilter === "all" || req.property_id === propertyFilter;
    const matchesSearch =
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesProperty && matchesSearch;
  });

  // Filter historical records
  const filteredRecords = records.filter((rec) => {
    const matchesProperty = propertyFilter === "all" || rec.property_id === propertyFilter;
    const matchesSearch =
      rec.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.work_performed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.performed_by_name && rec.performed_by_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rec.invoice_number && rec.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesProperty && matchesSearch;
  });

  // Assets belonging to currently chosen property in modal
  const propertyAssets = assets.filter((a) => a.property_id === selectedPropInForm);

  function handleAddPhoto() {
    if (!photoUrl.trim()) return;
    setPhotosList([...photosList, photoUrl.trim()]);
    setPhotoUrl("");
  }

  function handleOpenComplete(req: MaintenanceRequestItem) {
    setActiveRequestForCompletion(req);
    setFeedback(null);
    setIsCompleteModalOpen(true);
  }

  async function handleFaultSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("businessId", business.id);
    formData.set("photosJson", JSON.stringify(photosList));

    startTransition(async () => {
      const res = await createMaintenanceRequestAction(formData);
      setFeedback(res);
      if (res.ok) {
        setTimeout(() => {
          setIsFaultModalOpen(false);
          setFeedback(null);
          setPhotosList([]);
        }, 1200);
      }
    });
  }

  async function handleCompleteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("businessId", business.id);
    if (activeRequestForCompletion) {
      formData.set("requestId", activeRequestForCompletion.id);
      formData.set("propertyId", activeRequestForCompletion.property_id);
      if (activeRequestForCompletion.asset_id) {
        formData.set("assetId", activeRequestForCompletion.asset_id);
      }
    }

    startTransition(async () => {
      const res = await recordMaintenanceCompletionAction(formData);
      setFeedback(res);
      if (res.ok) {
        setTimeout(() => {
          setIsCompleteModalOpen(false);
          setActiveRequestForCompletion(null);
          setFeedback(null);
        }, 1200);
      }
    });
  }

  const severityStyles: Record<FaultSeverityLevel, string> = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-amber-100 text-amber-800 border-amber-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const statusStyles: Record<MaintenanceRequestStatus, string> = {
    open: "bg-blue-50 text-blue-700 border-blue-200",
    quote_requested: "bg-indigo-50 text-indigo-700 border-indigo-200",
    scheduled: "bg-purple-50 text-purple-700 border-purple-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Maintenance Management & Fault Reporting
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch technicians, track emergency breakdowns, schedule repairs, and record audited maintenance costs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setActiveRequestForCompletion(null);
              setIsCompleteModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
          >
            Record Work / Invoice
          </button>
          <button
            onClick={() => {
              setPhotosList([]);
              setFeedback(null);
              setIsFaultModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition"
          >
            <span>⚡</span> Report Fault
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === "requests"
              ? "border-teal-600 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Active Maintenance Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === "history"
              ? "border-teal-600 text-teal-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Maintenance History & Invoices ({records.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder={
              activeTab === "requests"
                ? "Search maintenance requests by title, description..."
                : "Search maintenance history by work summary, invoice #, technician..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {activeTab === "requests" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">All Request Statuses</option>
            <option value="open">Open Faults</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          <option value="all">All Properties ({properties.length})</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </div>

      {/* TAB 1: Maintenance Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="text-4xl mb-3">🛠️</div>
              <h3 className="text-base font-semibold text-slate-800">No maintenance requests found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {searchTerm || statusFilter !== "all" || propertyFilter !== "all"
                  ? "No requests match your current search and filter selections."
                  : "All equipment and properties are currently operational with no outstanding faults."}
              </p>
              <button
                onClick={() => {
                  setPhotosList([]);
                  setFeedback(null);
                  setIsFaultModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition"
              >
                Report a Fault Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((req) => {
                const prop = properties.find((p) => p.id === req.property_id);
                const asset = assets.find((a) => a.id === req.asset_id);

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider border ${
                            severityStyles[req.fault_severity] || "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {req.fault_severity} Priority
                        </span>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider border capitalize ${
                            statusStyles[req.status] || "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {req.status.replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">{req.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                        {req.description}
                      </p>

                      <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Property:</span>
                          <span className="font-semibold text-slate-800">
                            {prop?.name || "Assigned Site"} ({prop?.code || "—"})
                          </span>
                        </div>
                        {asset && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Equipment:</span>
                            <span className="font-semibold text-slate-800">
                              {asset.name} ({asset.asset_tag})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Estimated Cost:</span>
                          <span className="font-semibold text-slate-900">
                            {formatMinorUnits(req.estimated_cost_kobo || 0)}
                          </span>
                        </div>
                        {req.scheduled_date && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Scheduled Date:</span>
                            <span className="font-semibold text-teal-700">
                              {new Date(req.scheduled_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {req.photos && req.photos.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 overflow-x-auto py-1">
                          <span className="text-2xs font-semibold text-slate-500">Photos:</span>
                          {req.photos.map((photo, i) => (
                            <a
                              key={i}
                              href={photo}
                              target="_blank"
                              rel="noreferrer"
                              className="text-2xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200"
                            >
                              Image {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-2xs text-slate-400">
                        Reported: {new Date(req.created_at).toLocaleDateString()}
                      </span>
                      {req.status !== "completed" && req.status !== "cancelled" && (
                        <button
                          onClick={() => handleOpenComplete(req)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                        >
                          Record Completion & Cost
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Maintenance Records (History & Invoices) */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-base font-semibold text-slate-800">No maintenance records yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Completed maintenance work, technician sign-offs, and uploaded invoices will be logged here for full auditability.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-2xs uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Completion Date</th>
                    <th className="py-3.5 px-4">Summary & Work Done</th>
                    <th className="py-3.5 px-4">Technician / Vendor</th>
                    <th className="py-3.5 px-4">Parts Replaced</th>
                    <th className="py-3.5 px-4">Incurred Cost</th>
                    <th className="py-3.5 px-4">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {new Date(rec.performed_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{rec.summary}</div>
                        <div className="text-2xs text-slate-500 mt-0.5 line-clamp-2">
                          {rec.work_performed}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {rec.performed_by_name || "EasyLife Verified Pro"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {rec.parts_replaced || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {formatMinorUnits(rec.cost_kobo || 0)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.invoice_url ? (
                          <a
                            href={rec.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 font-semibold underline text-2xs"
                          >
                            <span>🧾</span> {rec.invoice_number || "View Invoice"}
                          </a>
                        ) : rec.invoice_number ? (
                          <span className="font-mono text-2xs text-slate-600">
                            #{rec.invoice_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-2xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Report Fault */}
      {isFaultModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Report Equipment or Facility Fault</h2>
              <button
                onClick={() => setIsFaultModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                  feedback.ok
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleFaultSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Site *
                </label>
                <select
                  name="propertyId"
                  value={selectedPropInForm}
                  onChange={(e) => {
                    setSelectedPropInForm(e.target.value);
                    setSelectedAssetInForm("");
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Asset / Equipment (Optional)
                </label>
                <select
                  name="assetId"
                  value={selectedAssetInForm}
                  onChange={(e) => setSelectedAssetInForm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">General Facility (No specific asset)</option>
                  {propertyAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.asset_tag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fault Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. AC compressor humming loudly, generator refusing to crank"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Severity Level *
                  </label>
                  <select
                    name="faultSeverity"
                    defaultValue="medium"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="low">Low (Cosmetic / Minor)</option>
                    <option value="medium">Medium (Degraded Performance)</option>
                    <option value="high">High (Equipment Stoppage)</option>
                    <option value="critical">Critical (Facility-wide Outage / Safety Risk)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Date
                  </label>
                  <input
                    type="date"
                    name="scheduledDate"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Repair Budget (NGN)
                </label>
                <input
                  type="number"
                  name="estimatedCostNaira"
                  min="0"
                  step="500"
                  placeholder="e.g. 35000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Fault Description *
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  placeholder="Describe symptoms, when it started, error codes on display panels..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Photos attachment */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Supporting Photographs / Video Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... photo url"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                  >
                    Attach
                  </button>
                </div>
                {photosList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {photosList.map((p, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-2xs font-semibold"
                      >
                        Photo {idx + 1}
                        <button
                          type="button"
                          onClick={() => setPhotosList(photosList.filter((_, i) => i !== idx))}
                          className="text-red-500 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFaultModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Submit Maintenance Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Completion & Incurred Cost */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Record Maintenance Completion & Invoice
              </h2>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                  feedback.ok
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              {!activeRequestForCompletion && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Property *
                    </label>
                    <select
                      name="propertyId"
                      defaultValue={properties[0]?.id || ""}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Equipment Asset (Optional)
                    </label>
                    <select
                      name="assetId"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="">General Facility Maintenance</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.asset_tag})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Summary *
                </label>
                <input
                  type="text"
                  name="summary"
                  defaultValue={
                    activeRequestForCompletion
                      ? `Resolved: ${activeRequestForCompletion.title}`
                      : ""
                  }
                  required
                  placeholder="e.g. 500kVA Generator 250-Hour Major Service"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Details of Work Performed *
                </label>
                <textarea
                  name="workPerformed"
                  rows={2}
                  required
                  placeholder="Changed engine oil (15W-40), replaced primary & secondary fuel filters, flushed radiator coolant..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Technician / Vendor Name *
                  </label>
                  <input
                    type="text"
                    name="performedByName"
                    defaultValue="EasyLife Verified Technician"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Cost (NGN) *
                  </label>
                  <input
                    type="number"
                    name="costNaira"
                    min="0"
                    step="100"
                    required
                    placeholder="e.g. 85000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parts Replaced
                </label>
                <input
                  type="text"
                  name="partsReplaced"
                  placeholder="e.g. Oil filter LF9009, Fuel filter FF5776, 2x 100Ah Batteries"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    placeholder="e.g. INV-2026-081"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice URL / PDF Link
                  </label>
                  <input
                    type="url"
                    name="invoiceUrl"
                    placeholder="https://... invoice link"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isPending ? "Recording..." : "Record & Close"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
