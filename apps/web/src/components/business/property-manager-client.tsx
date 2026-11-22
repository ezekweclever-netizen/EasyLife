"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { managePropertyAction } from "@/app/actions/business";
import type { PropertyType } from "@easylife/shared-types";

interface PropertyItem {
  id: string;
  business_id: string;
  name: string;
  code: string;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  lga_or_district?: string | null;
  units_count?: number;
  notes?: string | null;
  created_at?: string;
}

interface PropertyManagerClientProps {
  business: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  properties: PropertyItem[];
}

export function PropertyManagerClient({
  business,
  properties,
}: PropertyManagerClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || p.property_type === selectedType;
    return matchesSearch && matchesType;
  });

  function handleOpenCreate() {
    setEditingProperty(null);
    setFeedback(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(prop: PropertyItem) {
    setEditingProperty(prop);
    setFeedback(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    formData.set("businessId", business.id);
    if (editingProperty) {
      formData.set("propertyId", editingProperty.id);
    }

    startTransition(async () => {
      const res = await managePropertyAction(formData);
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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0D223A] p-6 rounded-2xl border border-slate-200 dark:border-[#163654]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Managed Properties
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register and manage real estate sites, facilities, and maintenance locations for {business.name}.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs transition"
        >
          <span>+</span> Add New Property
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search properties by name, code, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          <option value="all">All Property Types</option>
          <option value="commercial">Commercial</option>
          <option value="residential">Residential</option>
          <option value="industrial">Industrial</option>
          <option value="mixed_use">Mixed Use</option>
        </select>
      </div>

      {/* Properties Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">No properties found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchTerm || selectedType !== "all"
              ? "No properties match your current search or filter criteria."
              : "Get started by adding your first commercial or residential facility to track maintenance."}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition"
          >
            Add Property Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prop) => (
            <div
              key={prop.id}
              className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    {prop.code}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold capitalize bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#5CD3D5] border border-teal-200 dark:border-teal-800">
                    {prop.property_type.replace("_", " ")}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {prop.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                  📍 {prop.address}, {prop.city}, {prop.state}
                  {prop.lga_or_district ? ` (${prop.lga_or_district})` : ""}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 block font-medium">Capacity</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{prop.units_count ?? 1} Units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Status</span>
                    <span className="font-semibold text-emerald-600">Active Facility</span>
                  </div>
                </div>

                {prop.notes && (
                  <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-[#071526] p-2 rounded-lg">
                    "{prop.notes}"
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  href={`/business/assets?propertyId=${prop.id}`}
                  className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:text-[#5CD3D5]"
                >
                  View Equipment →
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/business/maintenance?propertyId=${prop.id}`}
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white dark:text-white"
                  >
                    History
                  </Link>
                  <button
                    onClick={() => handleOpenEdit(prop)}
                    className="text-xs font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Property */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-[#163654] my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingProperty ? "Edit Property" : "Register New Property"}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProperty?.name || ""}
                  required
                  placeholder="e.g. Trans-Amadi Regional Office"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Property Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingProperty?.code || ""}
                    required
                    placeholder="e.g. PH-HQ-01"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Property Type *
                  </label>
                  <select
                    name="propertyType"
                    defaultValue={editingProperty?.property_type || "commercial"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="commercial">Commercial</option>
                    <option value="residential">Residential</option>
                    <option value="industrial">Industrial</option>
                    <option value="mixed_use">Mixed Use</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingProperty?.address || ""}
                  required
                  placeholder="e.g. 14 Trans-Amadi Industrial Layout"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingProperty?.city || business.city || "Port Harcourt"}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    defaultValue={editingProperty?.state || business.state || "Rivers State"}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Units / Blocks
                  </label>
                  <input
                    type="number"
                    name="unitsCount"
                    min="1"
                    defaultValue={editingProperty?.units_count || 1}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  LGA / District
                </label>
                <input
                  type="text"
                  name="lga"
                  defaultValue={editingProperty?.lga_or_district || ""}
                  placeholder="e.g. Port Harcourt City LGA / GRA Phase 2"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Internal Notes
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingProperty?.notes || ""}
                  placeholder="Access instructions, security contacts, generator room locations..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#163654] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
                  {isPending ? "Saving..." : editingProperty ? "Update Property" : "Register Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
