"use client";

import React, { useState, useTransition } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryActiveAction,
  reorderCategoriesAction,
} from "@/app/actions/admin-categories";
import type { ServiceCategoryItem } from "@/lib/supabase/customer";

interface AdminCategoryManagerProps {
  initialCategories: ServiceCategoryItem[];
}

const AVAILABLE_ICONS = [
  { name: "wrench", label: "Wrench (Plumbing)" },
  { name: "zap", label: "Zap / Lightning (Electrical)" },
  { name: "wind", label: "Wind (AC / Refrigeration)" },
  { name: "settings", label: "Gears / Settings (Generator / Mechanics)" },
  { name: "sparkles", label: "Sparkles (Cleaning / Fumigation)" },
  { name: "paintbrush", label: "Paintbrush (Painting / Finishes)" },
  { name: "hammer", label: "Hammer (Carpentry / Timber)" },
  { name: "shield", label: "Shield (Pest Control / Security)" },
  { name: "tool", label: "Toolbox (General Maintenance)" },
  { name: "sun", label: "Sun (Solar Energy)" },
  { name: "cpu", label: "CPU / Electronics" },
  { name: "truck", label: "Truck / Logistics" },
];

export function AdminCategoryManager({
  initialCategories,
}: AdminCategoryManagerProps) {
  const [categories, setCategories] = useState<ServiceCategoryItem[]>(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategoryItem | null>(null);

  // Form states for Add / Edit
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("tool");
  const [formCommissionBps, setFormCommissionBps] = useState(1000);
  const [formDisplayOrder, setFormDisplayOrder] = useState(10);
  const [formParentId, setFormParentId] = useState("");

  const openAddModal = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("tool");
    setFormCommissionBps(1000);
    setFormDisplayOrder(categories.length + 1);
    setFormParentId("");
    setEditingCategory(null);
    setIsAddOpen(true);
  };

  const openEditModal = (cat: ServiceCategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || "");
    setFormIcon(cat.icon_name || "tool");
    setFormCommissionBps(cat.default_commission_bps || 1000);
    setFormDisplayOrder(cat.display_order || 0);
    setFormParentId(cat.parent_id || "");
    setIsAddOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.append("name", formName);
    formData.append("slug", formSlug);
    formData.append("description", formDescription);
    formData.append("iconName", formIcon);
    formData.append("defaultCommissionBps", formCommissionBps.toString());
    formData.append("displayOrder", formDisplayOrder.toString());
    formData.append("parentId", formParentId);

    startTransition(async () => {
      let res;
      if (editingCategory) {
        formData.append("id", editingCategory.id);
        formData.append("isActive", editingCategory.is_active ? "true" : "false");
        res = await updateCategoryAction({ status: "idle", message: "" }, formData);
      } else {
        res = await createCategoryAction({ status: "idle", message: "" }, formData);
      }

      if (res.status === "error") {
        setFeedback({ type: "error", text: res.message });
      } else {
        setFeedback({ type: "success", text: res.message });
        setIsAddOpen(false);
        // Refresh local state
        if (editingCategory) {
          setCategories(
            categories.map((c) =>
              c.id === editingCategory.id
                ? {
                    ...c,
                    name: formName,
                    slug: formSlug || c.slug,
                    description: formDescription,
                    icon_name: formIcon,
                    default_commission_bps: formCommissionBps,
                    display_order: formDisplayOrder,
                  }
                : c
            )
          );
        } else {
          setCategories([
            ...categories,
            {
              id: Math.random().toString(),
              name: formName,
              slug: formSlug,
              description: formDescription,
              icon_name: formIcon,
              default_commission_bps: formCommissionBps,
              display_order: formDisplayOrder,
              is_active: true,
            },
          ]);
        }
      }
    });
  };

  const handleToggleStatus = (cat: ServiceCategoryItem) => {
    const newStatus = !cat.is_active;
    startTransition(async () => {
      const res = await toggleCategoryActiveAction(cat.id, newStatus);
      if (res.ok) {
        setCategories(
          categories.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c))
        );
        setFeedback({ type: "success", text: `Category "${cat.name}" is now ${newStatus ? "active" : "disabled"}.` });
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleMoveOrder = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const temp = reordered[index]!;
    reordered[index] = reordered[targetIndex]!;
    reordered[targetIndex] = temp;

    // Re-assign display_order
    const updated = reordered.map((c, i) => ({ ...c, display_order: i + 1 }));
    setCategories(updated);

    startTransition(async () => {
      await reorderCategoriesAction(
        updated.map((c) => ({ id: c.id, display_order: c.display_order }))
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            System Service Categories ({categories.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, re-order, edit descriptions, toggle active status, and assign icons.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs self-start sm:self-auto"
        >
          + Add New Category
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Order</th>
                <th className="py-3 px-4">Category Name &amp; Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Icon</th>
                <th className="py-3 px-4 text-center">Fee (bps)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 font-mono font-bold text-slate-500">
                      <span>#{cat.display_order}</span>
                      <div className="flex flex-col ml-1">
                        <button
                          type="button"
                          disabled={idx === 0 || isPending}
                          onClick={() => handleMoveOrder(idx, "up")}
                          className="text-[10px] text-slate-400 hover:text-slate-800 disabled:opacity-20"
                          title="Move Up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === categories.length - 1 || isPending}
                          onClick={() => handleMoveOrder(idx, "down")}
                          className="text-[10px] text-slate-400 hover:text-slate-800 disabled:opacity-20"
                          title="Move Down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{cat.name}</div>
                    <span className="text-[11px] font-mono text-slate-400 font-normal">
                      /{cat.slug}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                    <p className="line-clamp-2 leading-relaxed">
                      {cat.description || "No description specified."}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-[#0D9488] font-mono text-[11px] font-bold">
                      {cat.icon_name || "tool"}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono">
                    {(cat.default_commission_bps / 100).toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleStatus(cat)}
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                        cat.is_active
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {cat.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Service Category"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Solar installation and maintenance"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug (optional - auto-derived)
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. solar-installation"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the trade services and scope..."
                  className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Category (Optional - select if this is a subcategory)
                </label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Icon
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full h-10 px-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-lg bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50 transition shadow-xs"
                >
                  {isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
