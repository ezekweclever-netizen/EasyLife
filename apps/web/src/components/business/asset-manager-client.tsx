"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { manageAssetAction } from "@/app/actions/business";
import type { AssetCategory, AssetStatus } from "@easylife/shared-types";

interface AssetItem {
  id: string;
  business_id: string;
  property_id: string;
  asset_category: AssetCategory;
  name: string;
  asset_tag: string;
  brand?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  location_in_property?: string | null;
  status: AssetStatus;
  installation_date?: string | null;
  maintenance_interval_days?: number;
  documents?: Array<{ name: string; url: string }> | null;
  notes?: string | null;
  properties?: { name: string; code: string } | null;
}

interface PropertyOption {
  id: string;
  name: string;
  code: string;
}

interface AssetManagerClientProps {
  business: {
    id: string;
    name: string;
  };
  properties: PropertyOption[];
  assets: AssetItem[];
  initialPropertyFilter?: string;
}

const CATEGORY_TABS: Array<{ id: string; label: string; icon: string }> = [
  { id: "all", label: "All Assets", icon: "📦" },
  { id: "air_conditioner", label: "Air Conditioners", icon: "❄️" },
  { id: "generator", label: "Generators", icon: "⚡" },
  { id: "inverter", label: "Inverters", icon: "🔋" },
  { id: "solar_system", label: "Solar Systems", icon: "☀️" },
  { id: "refrigeration", label: "Refrigeration", icon: "🧊" },
  { id: "pump", label: "Pumps", icon: "💧" },
  { id: "electrical", label: "Electrical", icon: "🔌" },
  { id: "other", label: "Other Maintainable", icon: "⚙️" },
];

export function AssetManagerClient({
  business,
  properties,
  assets,
  initialPropertyFilter = "all",
}: AssetManagerClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProperty, setSelectedProperty] = useState<string>(initialPropertyFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [documentsList, setDocumentsList] = useState<Array<{ name: string; url: string }>>([]);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory =
      selectedCategory === "all" || asset.asset_category === selectedCategory;
    const matchesProperty =
      selectedProperty === "all" || asset.property_id === selectedProperty;
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.brand && asset.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.model_number && asset.model_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesProperty && matchesSearch;
  });

  function handleOpenCreate() {
    setEditingAsset(null);
    setDocumentsList([]);
    setFeedback(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(asset: AssetItem) {
    setEditingAsset(asset);
    setDocumentsList(asset.documents || []);
    setFeedback(null);
    setIsModalOpen(true);
  }

  function handleAddDocument() {
    if (!docName.trim() || !docUrl.trim()) return;
    setDocumentsList([...documentsList, { name: docName.trim(), url: docUrl.trim() }]);
    setDocName("");
    setDocUrl("");
  }

  function handleRemoveDocument(index: number) {
    setDocumentsList(documentsList.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("businessId", business.id);
    if (editingAsset) {
      formData.set("assetId", editingAsset.id);
    }
    formData.set("documentsJson", JSON.stringify(documentsList));

    startTransition(async () => {
      const res = await manageAssetAction(formData);
      setFeedback(res);
      if (res.ok) {
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback(null);
        }, 1200);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1F2328] p-6 rounded-2xl border border-slate-200 dark:border-[#2E343B]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Equipment & Maintainable Assets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete inventory of facility hardware, generators, HVAC, power systems, and maintenance intervals.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition"
        >
          <span>+</span> Register New Equipment
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-[#2E343B]">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          const count =
            tab.id === "all"
              ? assets.length
              : assets.filter((a) => a.asset_category === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white dark:bg-[#1F2328] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-[#2E343B]"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-2xs ${
                  isActive ? "bg-slate-700 text-teal-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Property Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by equipment name, brand, model, serial #, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <select
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2E343B] bg-white dark:bg-[#1F2328] text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          <option value="all">All Properties ({properties.length})</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </div>

      {/* Assets Table / List */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <div className="text-4xl mb-3">⚙️</div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">No equipment items found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchTerm || selectedCategory !== "all" || selectedProperty !== "all"
              ? "No assets match your active category or filter settings."
              : "Register your facility equipment (generators, ACs, inverters, solar panels) to track maintenance cycles."}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition"
          >
            Register Equipment Now
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1F2328] rounded-2xl border border-slate-200 dark:border-[#2E343B] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-[#1F2328] border-b border-slate-200 dark:border-[#2E343B] text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Equipment & Tag</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Brand / Model</th>
                  <th className="py-3.5 px-4">Serial Number</th>
                  <th className="py-3.5 px-4">Property / Location</th>
                  <th className="py-3.5 px-4">Service Cycle</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAssets.map((asset) => {
                  const propertyName =
                    properties.find((p) => p.id === asset.property_id)?.name ||
                    asset.properties?.name ||
                    "Assigned Facility";

                  return (
                    <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#1F2328]/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{asset.name}</div>
                        <div className="text-2xs font-mono font-semibold text-teal-700 dark:text-teal-400 mt-0.5">
                          {asset.asset_tag}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-2xs font-semibold capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {asset.asset_category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                        {asset.brand || asset.model_number ? (
                          <>
                            <span className="font-semibold">{asset.brand || "—"}</span>
                            {asset.model_number && (
                              <span className="text-slate-500 dark:text-slate-400 block text-2xs">
                                Mod: {asset.model_number}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {asset.serial_number || <span className="text-slate-400 font-sans">—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 dark:text-white block">{propertyName}</span>
                        {asset.location_in_property && (
                          <span className="text-2xs text-slate-500 dark:text-slate-400 block">
                            📍 {asset.location_in_property}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          Every {asset.maintenance_interval_days ?? 90} days
                        </span>
                        {asset.installation_date && (
                          <span className="text-2xs text-slate-500 dark:text-slate-400 block">
                            Installed: {asset.installation_date}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/business/maintenance?action=report-fault&assetId=${asset.id}&propertyId=${asset.property_id}`}
                            className="px-2 py-1 rounded bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-[#F06A1F] font-semibold text-2xs"
                          >
                            Report Fault
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(asset)}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium text-2xs"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Registering / Editing Asset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1F2328] rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 dark:border-[#2E343B] my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingAsset ? "Edit Equipment Record" : "Register Maintainable Asset"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                  feedback.ok
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingAsset?.name || ""}
                    required
                    placeholder="e.g. 500kVA Cummins Diesel Generator"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Asset Tag / Inventory ID *
                  </label>
                  <input
                    type="text"
                    name="assetTag"
                    defaultValue={editingAsset?.asset_tag || ""}
                    required
                    placeholder="e.g. GEN-HQ-01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Category *
                  </label>
                  <select
                    name="assetCategory"
                    defaultValue={editingAsset?.asset_category || "air_conditioner"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="air_conditioner">Air Conditioner</option>
                    <option value="generator">Generator</option>
                    <option value="inverter">Inverter</option>
                    <option value="solar_system">Solar System</option>
                    <option value="refrigeration">Refrigeration Equipment</option>
                    <option value="pump">Pump</option>
                    <option value="electrical">Electrical Equipment</option>
                    <option value="other">Other Maintainable Asset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Property Location *
                  </label>
                  <select
                    name="propertyId"
                    defaultValue={editingAsset?.property_id || properties[0]?.id || ""}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    name="brand"
                    defaultValue={editingAsset?.brand || ""}
                    placeholder="e.g. Cummins, Daikin, LG"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    name="modelNumber"
                    defaultValue={editingAsset?.model_number || ""}
                    placeholder="e.g. C500D5e"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    defaultValue={editingAsset?.serial_number || ""}
                    placeholder="e.g. SN-8924018A"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Location within Facility
                  </label>
                  <input
                    type="text"
                    name="locationInProperty"
                    defaultValue={editingAsset?.location_in_property || ""}
                    placeholder="e.g. Generator House, Rooftop"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    name="installationDate"
                    defaultValue={editingAsset?.installation_date || ""}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Maintenance Cycle (Days)
                  </label>
                  <input
                    type="number"
                    name="maintenanceIntervalDays"
                    defaultValue={editingAsset?.maintenance_interval_days || 90}
                    min="7"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="p-3 bg-slate-50 dark:bg-[#1F2328] rounded-xl border border-slate-200 dark:border-[#2E343B] space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Supporting Documents (Warranty, Manuals, Commissioning Reports)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Document Title (e.g. Warranty Certificate)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E343B] text-xs bg-white dark:bg-[#1F2328]"
                  />
                  <input
                    type="url"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    placeholder="Document URL (https://...)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2E343B] text-xs bg-white dark:bg-[#1F2328]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocument}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                  >
                    Add
                  </button>
                </div>

                {documentsList.length > 0 && (
                  <ul className="divide-y divide-slate-200 text-2xs mt-2">
                    {documentsList.map((doc, idx) => (
                      <li key={idx} className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">📄 {doc.name}</span>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 dark:text-teal-400 underline"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(idx)}
                            className="text-red-500 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Technical Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingAsset?.notes || ""}
                  placeholder="Service requirements, fuel specs, oil filter part numbers..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2E343B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingAsset ? "Update Asset" : "Register Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
