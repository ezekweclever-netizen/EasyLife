"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  archiveCategoryAction,
  createCategoryAction,
  reorderCategoriesAction,
  restoreCategoryAction,
  toggleCategoryFlagAction,
  updateCategoryAction,
} from "@/app/actions/admin-categories";
import type { AdminCategoryRecord } from "@/lib/supabase/admin-catalogue";

interface AdminCategoryManagerProps {
  initialCategories: AdminCategoryRecord[];
}

const AVAILABLE_ICONS = [
  { name: "wrench", label: "Wrench (Plumbing / Mechanical)" },
  { name: "zap", label: "Zap / Lightning (Electrical)" },
  { name: "wind", label: "Wind (AC / HVAC)" },
  { name: "settings", label: "Gears (Generator / Repairs)" },
  { name: "sparkles", label: "Sparkles (Cleaning / Care)" },
  { name: "paintbrush", label: "Paintbrush (Painting / Finishes)" },
  { name: "hammer", label: "Hammer (Carpentry / Timber)" },
  { name: "shield", label: "Shield (Pest Control / Security)" },
  { name: "sun", label: "Sun (Solar / Renewable Energy)" },
  { name: "grid", label: "Grid (Tiling / Flooring)" },
  { name: "car", label: "Car (Automotive)" },
  { name: "truck", label: "Truck (Moving / Relocation)" },
  { name: "shirt", label: "Shirt (Laundry / Dry Cleaning)" },
  { name: "scissors", label: "Scissors (Beauty & Grooming)" },
  { name: "calendar", label: "Calendar (Events & Hospitality)" },
  { name: "droplets", label: "Droplets (Borehole / Water)" },
  { name: "cpu", label: "CPU / Appliances & Electronics" },
  { name: "tool", label: "Toolbox (General Maintenance)" },
];

type CategoryFilterMode =
  | "active_non_archived"
  | "all_non_archived"
  | "main_only"
  | "featured"
  | "popular"
  | "homepage"
  | "archived";

export function AdminCategoryManager({
  initialCategories,
}: AdminCategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategoryRecord[]>(initialCategories);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Search, filter & tree expansion
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] =
    useState<CategoryFilterMode>("all_non_archived");
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const c of initialCategories) {
      if (!c.parent_id) initial[c.id] = true;
    }
    return initial;
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryRecord | null>(
    null
  );

  // Modal form fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("tool");
  const [formCommissionPct, setFormCommissionPct] = useState("10");
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formParentId, setFormParentId] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formRemoveImage, setFormRemoveImage] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formShowOnHomepage, setFormShowOnHomepage] = useState(false);

  // Cleanup object URL preview
  useEffect(() => {
    return () => {
      if (formImagePreview && formImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(formImagePreview);
      }
    };
  }, [formImagePreview]);

  const nonArchivedMain = useMemo(
    () =>
      categories
        .filter((c) => !c.parent_id && !c.deleted_at)
        .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)),
    [categories]
  );

  const nonArchivedSubs = useMemo(
    () =>
      categories
        .filter((c) => Boolean(c.parent_id) && !c.deleted_at)
        .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)),
    [categories]
  );

  const kpis = useMemo(() => {
    const activeMain = nonArchivedMain.filter((c) => c.is_active).length;
    const activeSubs = nonArchivedSubs.filter((c) => c.is_active).length;
    const homepageCount = nonArchivedMain.filter(
      (c) => c.is_active && c.show_on_homepage
    ).length;
    const totalServices = nonArchivedMain.reduce(
      (sum, c) => sum + c.service_count,
      0
    );
    return {
      mainTotal: nonArchivedMain.length,
      mainActive: activeMain,
      subTotal: nonArchivedSubs.length,
      subActive: activeSubs,
      homepageCount,
      totalServices,
    };
  }, [nonArchivedMain, nonArchivedSubs]);

  const subcategoriesByParent = useMemo(() => {
    const map = new Map<string, AdminCategoryRecord[]>();
    for (const c of categories) {
      if (!c.parent_id) continue;
      if (filterMode !== "archived" && c.deleted_at) continue;
      const list = map.get(c.parent_id) ?? [];
      list.push(c);
      map.set(c.parent_id, list);
    }
    for (const [k, list] of map.entries()) {
      map.set(
        k,
        list.sort(
          (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)
        )
      );
    }
    return map;
  }, [categories, filterMode]);

  const matchesQuery = (cat: AdminCategoryRecord, q: string): boolean => {
    if (!q) return true;
    const hay = [
      cat.name,
      cat.slug,
      cat.description || "",
      ...(cat.keywords || []),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  };

  const matchesFilter = (cat: AdminCategoryRecord): boolean => {
    switch (filterMode) {
      case "archived":
        return Boolean(cat.deleted_at);
      case "active_non_archived":
        return !cat.deleted_at && cat.is_active;
      case "featured":
        return !cat.deleted_at && Boolean(cat.is_featured);
      case "popular":
        return !cat.deleted_at && Boolean(cat.is_popular);
      case "homepage":
        return !cat.deleted_at && Boolean(cat.show_on_homepage);
      case "main_only":
        return !cat.deleted_at && !cat.parent_id;
      default:
        return !cat.deleted_at;
    }
  };

  const visibleMainTree = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (filterMode === "archived") {
      return [];
    }

    const result: Array<{
      main: AdminCategoryRecord;
      children: AdminCategoryRecord[];
    }> = [];

    for (const main of nonArchivedMain) {
      const allChildren = subcategoriesByParent.get(main.id) ?? [];
      const matchingChildren = allChildren.filter(
        (sub) =>
          filterMode !== "main_only" &&
          matchesFilter(sub) &&
          (matchesQuery(sub, q) || matchesQuery(main, q))
      );

      const mainMatched = matchesFilter(main) && matchesQuery(main, q);

      if (mainMatched || matchingChildren.length > 0) {
        result.push({
          main,
          children: filterMode === "main_only" ? [] : matchingChildren,
        });
      }
    }

    return result;
  }, [nonArchivedMain, subcategoriesByParent, searchQuery, filterMode]);

  const archivedCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categories
      .filter((c) => Boolean(c.deleted_at) && matchesQuery(c, q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, searchQuery]);

  const toggleExpand = (mainId: string) => {
    setExpandedParents((prev) => ({ ...prev, [mainId]: !prev[mainId] }));
  };

  const setAllExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    for (const m of nonArchivedMain) next[m.id] = expanded;
    setExpandedParents(next);
  };

  const resetImageState = (existingUrl: string | null | undefined) => {
    if (formImagePreview && formImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(formImagePreview);
    }
    setFormImageFile(null);
    setFormRemoveImage(false);
    setFormImageUrl(existingUrl || "");
    setFormImagePreview(existingUrl || null);
  };

  const openAddModal = (presetParentId = "") => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("tool");
    setFormCommissionPct("10");
    const siblings = presetParentId
      ? subcategoriesByParent.get(presetParentId) ?? []
      : nonArchivedMain;
    setFormDisplayOrder(siblings.length + 1);
    setFormParentId(presetParentId);
    setFormKeywords("");
    resetImageState(null);
    setFormIsActive(true);
    setFormIsFeatured(false);
    setFormIsPopular(false);
    setFormShowOnHomepage(!presetParentId);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: AdminCategoryRecord) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || "");
    setFormIcon(cat.icon_name || "tool");
    setFormCommissionPct(((cat.default_commission_bps || 1000) / 100).toString());
    setFormDisplayOrder(cat.display_order || 0);
    setFormParentId(cat.parent_id || "");
    setFormKeywords((cat.keywords || []).join(", "));
    resetImageState(cat.image_url);
    setFormIsActive(cat.is_active);
    setFormIsFeatured(Boolean(cat.is_featured));
    setFormIsPopular(Boolean(cat.is_popular));
    setFormShowOnHomepage(Boolean(cat.show_on_homepage));
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formImagePreview && formImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(formImagePreview);
    }
    setFormImageFile(file);
    setFormRemoveImage(false);
    setFormImagePreview(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    if (formImagePreview && formImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(formImagePreview);
    }
    setFormImageFile(null);
    setFormImageUrl("");
    setFormImagePreview(null);
    setFormRemoveImage(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const commissionNum = Number.parseFloat(formCommissionPct);
    const commissionBps = Number.isFinite(commissionNum)
      ? Math.round(commissionNum * 100)
      : 1000;

    const formData = new FormData();
    formData.append("name", formName);
    formData.append("slug", formSlug);
    formData.append("description", formDescription);
    formData.append("iconName", formIcon);
    formData.append("defaultCommissionBps", String(commissionBps));
    formData.append("displayOrder", String(formDisplayOrder));
    formData.append("parentId", formParentId);
    formData.append("keywords", formKeywords);
    formData.append("isActive", formIsActive ? "true" : "false");
    formData.append("isFeatured", formIsFeatured ? "true" : "false");
    formData.append("isPopular", formIsPopular ? "true" : "false");
    formData.append(
      "showOnHomepage",
      !formParentId && formShowOnHomepage ? "true" : "false"
    );
    formData.append("imageUrl", formImageUrl);
    if (formRemoveImage) {
      formData.append("removeImage", "true");
    }
    if (formImageFile) {
      formData.append("imageFile", formImageFile);
    }

    startTransition(async () => {
      let res;
      if (editingCategory) {
        formData.append("id", editingCategory.id);
        res = await updateCategoryAction({ status: "idle", message: "" }, formData);
      } else {
        res = await createCategoryAction({ status: "idle", message: "" }, formData);
      }

      if (res.status === "error") {
        setFeedback({ type: "error", text: res.message });
      } else {
        setFeedback({ type: "success", text: res.message });
        setIsModalOpen(false);
        if (res.data) {
          const savedRow = res.data;
          setCategories((prev) => {
            const exists = prev.some((c) => c.id === savedRow.id);
            if (exists) {
              return prev.map((c) =>
                c.id === savedRow.id ? { ...c, ...savedRow } : c
              );
            }
            const added: AdminCategoryRecord = {
              ...savedRow,
              keywords: savedRow.keywords || [],
              subcategory_count: 0,
              service_count: 0,
              active_service_count: 0,
              professional_service_count: 0,
              booking_count: 0,
            };
            return [...prev, added];
          });
          if (savedRow.parent_id) {
            setExpandedParents((prev) => ({
              ...prev,
              [savedRow.parent_id!]: true,
            }));
          }
        }
        router.refresh();
      }
    });
  };

  const handleToggleFlag = (
    cat: AdminCategoryRecord,
    field: "is_active" | "is_featured" | "is_popular" | "show_on_homepage"
  ) => {
    const nextVal = !Boolean(cat[field]);
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleCategoryFlagAction(cat.id, field, nextVal);
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === cat.id ? { ...c, [field]: nextVal } : c))
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleReorderScope = (
    siblings: AdminCategoryRecord[],
    index: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const reordered = [...siblings];
    const current = reordered[index]!;
    reordered[index] = reordered[targetIndex]!;
    reordered[targetIndex] = current;

    const updatedOrders = reordered.map((c, idx) => ({
      id: c.id,
      display_order: idx + 1,
    }));
    const orderMap = new Map(updatedOrders.map((u) => [u.id, u.display_order]));

    setCategories((prev) =>
      prev.map((c) =>
        orderMap.has(c.id) ? { ...c, display_order: orderMap.get(c.id)! } : c
      )
    );

    startTransition(async () => {
      const res = await reorderCategoriesAction(updatedOrders);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.message });
      } else {
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      }
    });
  };

  const handleArchive = (cat: AdminCategoryRecord) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await archiveCategoryAction(cat.id);
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id
              ? {
                  ...c,
                  is_active: false,
                  show_on_homepage: false,
                  deleted_at: new Date().toISOString(),
                }
              : c
          )
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleRestore = (cat: AdminCategoryRecord) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await restoreCategoryAction(cat.id);
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id ? { ...c, deleted_at: null, is_active: false } : c
          )
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const parsedKeywordTags = useMemo(
    () =>
      formKeywords
        .split(/[\n,]+/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12),
    [formKeywords]
  );

  const editingHasActiveSubcategories = useMemo(() => {
    if (!editingCategory || editingCategory.parent_id) return false;
    return categories.some(
      (c) => c.parent_id === editingCategory.id && !c.deleted_at
    );
  }, [categories, editingCategory]);

  const parentLookup = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Main Categories
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {kpis.mainTotal}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {kpis.mainActive} active
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Subcategories
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {kpis.subTotal}
            </span>
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              {kpis.subActive} active
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Homepage Pinned
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {kpis.homepageCount}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              main categories
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Catalogue Services
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {kpis.totalServices}
            </span>
            <Link
              href="/admin/services"
              className="text-xs font-bold text-[#0D9488] hover:underline"
            >
              Open Services →
            </Link>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-[#0D223A] p-5 rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories, subcategories, slugs, or keywords..."
              className="w-full sm:max-w-sm h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <select
              value={filterMode}
              onChange={(e) =>
                setFilterMode(e.target.value as CategoryFilterMode)
              }
              aria-label="Filter categories"
              className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100"
            >
              <option value="all_non_archived">All Categories &amp; Subcategories</option>
              <option value="active_non_archived">Active Only</option>
              <option value="main_only">Main Categories Only</option>
              <option value="featured">Featured Only</option>
              <option value="popular">Popular Only</option>
              <option value="homepage">Shown on Homepage</option>
              <option value="archived">
                Archived ({categories.filter((c) => Boolean(c.deleted_at)).length})
              </option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filterMode !== "archived" && (
              <>
                <button
                  type="button"
                  onClick={() => setAllExpanded(true)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163654] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={() => setAllExpanded(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163654] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]"
                >
                  Collapse All
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => openAddModal(nonArchivedMain[0]?.id || "")}
              className="px-3.5 py-2 rounded-xl border border-teal-600 text-teal-700 dark:text-teal-400 text-xs font-bold hover:bg-teal-50 dark:bg-teal-950/60 transition"
            >
              + Add Subcategory
            </button>
            <button
              type="button"
              onClick={() => openAddModal("")}
              className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
            >
              + Add Main Category
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-900 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Archived Categories View */}
      {filterMode === "archived" ? (
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526] flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Archived Categories &amp; Subcategories ({archivedCategories.length})
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Historical bookings and pro links remain preserved.
            </span>
          </div>
          {archivedCategories.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No archived categories found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {archivedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {cat.parent_id
                          ? `Subcategory of ${parentLookup.get(cat.parent_id) || "Parent"}`
                          : "Main Category"}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      /{cat.slug} • Bookings: {cat.booking_count}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRestore(cat)}
                    className="px-3.5 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-[#5CD3D5] text-xs font-bold hover:bg-teal-100 disabled:opacity-50"
                  >
                    Restore Category
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Hierarchical Main Category + Subcategory Table */
        <div className="bg-white dark:bg-[#0D223A] rounded-2xl border border-slate-200 dark:border-[#163654] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#071526] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#163654]">
                <tr>
                  <th className="py-3 px-4 w-24 text-center">Order</th>
                  <th className="py-3 px-4 min-w-[260px]">
                    Category / Subcategory
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">
                    Keywords &amp; Stats
                  </th>
                  <th className="py-3 px-4 text-center">Fee</th>
                  <th className="py-3 px-4 text-center min-w-[240px]">
                    Visibility &amp; Status
                  </th>
                  <th className="py-3 px-4 text-right min-w-[210px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 dark:text-slate-100">
                {visibleMainTree.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No categories match the current search or filter.
                    </td>
                  </tr>
                ) : (
                  visibleMainTree.map(({ main, children }) => {
                    const mainIndexInAll = nonArchivedMain.findIndex(
                      (m) => m.id === main.id
                    );
                    const isExpanded = expandedParents[main.id] ?? true;

                    return (
                      <React.Fragment key={main.id}>
                        {/* MAIN CATEGORY ROW */}
                        <tr className="bg-white dark:bg-[#0D223A] hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]/80 transition">
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-slate-600 dark:text-slate-300">
                              <span>#{main.display_order}</span>
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={mainIndexInAll <= 0 || isPending}
                                  onClick={() =>
                                    handleReorderScope(
                                      nonArchivedMain,
                                      mainIndexInAll,
                                      "up"
                                    )
                                  }
                                  className="text-[10px] leading-none p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white disabled:opacity-20"
                                  title="Move Main Category Up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    mainIndexInAll === -1 ||
                                    mainIndexInAll >= nonArchivedMain.length - 1 ||
                                    isPending
                                  }
                                  onClick={() =>
                                    handleReorderScope(
                                      nonArchivedMain,
                                      mainIndexInAll,
                                      "down"
                                    )
                                  }
                                  className="text-[10px] leading-none p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white disabled:opacity-20"
                                  title="Move Main Category Down"
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleExpand(main.id)}
                                className="mt-1 w-6 h-6 rounded-md border border-slate-200 dark:border-[#163654] bg-slate-50 dark:bg-[#071526] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0"
                                title={
                                  isExpanded
                                    ? "Collapse subcategories"
                                    : "Expand subcategories"
                                }
                              >
                                {isExpanded ? "▾" : "▸"}
                              </button>

                              {main.image_url ? (
                                <img
                                  src={main.image_url}
                                  alt={main.name}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-[#163654] bg-slate-100 dark:bg-slate-800 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[#0D9488] flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                                  {main.icon_name || "tool"}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    {main.name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                                    Main
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">
                                  /{main.slug}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                                  {main.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {(main.keywords || []).slice(0, 4).map((kw) => (
                                <span
                                  key={kw}
                                  className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                                >
                                  {kw}
                                </span>
                              ))}
                              {(main.keywords || []).length > 4 && (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  +{(main.keywords || []).length - 4}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {main.subcategory_count} subcats • {main.service_count} services •{" "}
                              {main.professional_service_count} pros
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-200">
                            {(main.default_commission_bps / 100).toFixed(1)}%
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleToggleFlag(main, "is_active")}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                  main.is_active
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#163654] hover:bg-slate-200"
                                }`}
                              >
                                {main.is_active ? "Active" : "Disabled"}
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleToggleFlag(main, "is_featured")}
                                className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${
                                  main.is_featured
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                    : "bg-white dark:bg-[#0D223A] text-slate-400 border-slate-200 dark:border-[#163654] hover:text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                Featured
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleToggleFlag(main, "is_popular")}
                                className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${
                                  main.is_popular
                                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                    : "bg-white dark:bg-[#0D223A] text-slate-400 border-slate-200 dark:border-[#163654] hover:text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                Popular
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleToggleFlag(main, "show_on_homepage")
                                }
                                className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${
                                  main.show_on_homepage
                                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#5CD3D5] border-teal-200 dark:border-teal-800"
                                    : "bg-white dark:bg-[#0D223A] text-slate-400 border-slate-200 dark:border-[#163654] hover:text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                Homepage
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => openAddModal(main.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-bold text-teal-800 dark:text-[#5CD3D5] hover:bg-teal-100"
                                title="Add subcategory under this main category"
                              >
                                + Sub
                              </button>
                              <Link
                                href={`/admin/services?category=${main.id}`}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#163654] text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800"
                              >
                                Services
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditModal(main)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#163654] text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleArchive(main)}
                                className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-[11px] font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/60 disabled:opacity-40"
                              >
                                Archive
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* NESTED SUBCATEGORY ROWS */}
                        {isExpanded &&
                          children.map((sub) => {
                            const siblingList =
                              (subcategoriesByParent.get(main.id) ?? []).filter(
                                (s) => !s.deleted_at
                              );
                            const subIdx = siblingList.findIndex(
                              (s) => s.id === sub.id
                            );

                            return (
                              <tr
                                key={sub.id}
                                className="bg-slate-50 dark:bg-[#071526]/65 hover:bg-teal-50 dark:bg-teal-950/60/30 transition"
                              >
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>#{sub.display_order}</span>
                                    <div className="flex flex-col">
                                      <button
                                        type="button"
                                        disabled={subIdx <= 0 || isPending}
                                        onClick={() =>
                                          handleReorderScope(
                                            siblingList,
                                            subIdx,
                                            "up"
                                          )
                                        }
                                        className="text-[9px] leading-none p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white disabled:opacity-20"
                                        title="Move Subcategory Up"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          subIdx === -1 ||
                                          subIdx >= siblingList.length - 1 ||
                                          isPending
                                        }
                                        onClick={() =>
                                          handleReorderScope(
                                            siblingList,
                                            subIdx,
                                            "down"
                                          )
                                        }
                                        className="text-[9px] leading-none p-0.5 text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white disabled:opacity-20"
                                        title="Move Subcategory Down"
                                      >
                                        ▼
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex items-start gap-2.5 pl-6">
                                    <span className="text-slate-300 font-mono text-sm mt-1">
                                      └─
                                    </span>
                                    {sub.image_url ? (
                                      <img
                                        src={sub.image_url}
                                        alt={sub.name}
                                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] shrink-0"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654] text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                                        {sub.icon_name || "tool"}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                                          {sub.name}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-[#5CD3D5] border border-teal-200 dark:border-teal-800 text-[10px] font-semibold">
                                          Subcategory
                                        </span>
                                      </div>
                                      <div className="text-[11px] font-mono text-slate-400">
                                        /{sub.slug}
                                      </div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                        {sub.description || "No description"}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {(sub.keywords || []).slice(0, 3).map((kw) => (
                                      <span
                                        key={kw}
                                        className="px-2 py-0.5 rounded-full bg-white dark:bg-[#0D223A] border border-slate-200 dark:border-[#163654] text-slate-600 dark:text-slate-300 text-[10px]"
                                      >
                                        {kw}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {sub.service_count} services
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                                  {(sub.default_commission_bps / 100).toFixed(1)}%
                                </td>

                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() =>
                                        handleToggleFlag(sub, "is_active")
                                      }
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                        sub.is_active
                                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#163654]"
                                      }`}
                                    >
                                      {sub.is_active ? "Active" : "Disabled"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() =>
                                        handleToggleFlag(sub, "is_featured")
                                      }
                                      className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${
                                        sub.is_featured
                                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                          : "bg-white dark:bg-[#0D223A] text-slate-400 border-slate-200 dark:border-[#163654]"
                                      }`}
                                    >
                                      Featured
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() =>
                                        handleToggleFlag(sub, "is_popular")
                                      }
                                      className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${
                                        sub.is_popular
                                          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                          : "bg-white dark:bg-[#0D223A] text-slate-400 border-slate-200 dark:border-[#163654]"
                                      }`}
                                    >
                                      Popular
                                    </button>
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <Link
                                      href={`/admin/services?category=${main.id}&subcategory=${sub.id}`}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800"
                                    >
                                      Services
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(sub)}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => handleArchive(sub)}
                                      className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-[#0D223A] text-[11px] font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:bg-red-950/60 disabled:opacity-40"
                                    >
                                      Archive
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D223A] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-[#163654] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {editingCategory
                    ? `Edit ${editingCategory.parent_id ? "Subcategory" : "Main Category"}: ${editingCategory.name}`
                    : formParentId
                      ? "Create New Subcategory"
                      : "Create New Main Category"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure hierarchy, image asset, search keywords, and homepage visibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-slate-200 p-1.5 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Solar & Inverter Systems"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    URL Slug (auto-derived if empty)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. solar-inverter-systems"
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Parent Main Category
                </label>
                <select
                  value={formParentId}
                  disabled={editingHasActiveSubcategories}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-[#0D223A] disabled:bg-slate-100 dark:bg-slate-800 disabled:text-slate-500 dark:text-slate-400"
                >
                  <option value="">None (Top-Level Main Category)</option>
                  {nonArchivedMain
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                {editingHasActiveSubcategories && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                    This main category owns active subcategories, so it must stay at top level.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the services covered by this category..."
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              {/* Image Upload & URL */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#071526] border border-slate-200 dark:border-[#163654] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-100">
                    Category Image (PNG / JPG / WEBP, max 5 MB)
                  </label>
                  {formImagePreview && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {formImagePreview ? (
                    <img
                      src={formImagePreview}
                      alt="Category preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-[#163654] bg-white dark:bg-[#0D223A] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] flex items-center justify-center text-[11px] text-slate-400 shrink-0">
                      No image
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFileChange}
                      className="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 dark:bg-teal-950/60 file:text-teal-800 dark:text-[#5CD3D5] hover:file:bg-teal-100"
                    />
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setFormRemoveImage(false);
                        if (!formImageFile) {
                          setFormImagePreview(e.target.value.trim() || null);
                        }
                      }}
                      placeholder="Or paste existing URL / /categories/... path"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D223A] text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Search Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="e.g. borehole, submersible pump, plumbing, pipe leak"
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
                {parsedKeywordTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {parsedKeywordTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-[#5CD3D5] text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Category Icon
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-[#0D223A]"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic.name} value={ic.name}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Default Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={formCommissionPct}
                    onChange={(e) => setFormCommissionPct(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={formDisplayOrder}
                    onChange={(e) =>
                      setFormDisplayOrder(parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-[#163654] text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-teal-600"
                  />
                  <span>Active</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-[#163654] text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-teal-600"
                  />
                  <span>Featured</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-[#163654] text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-teal-600"
                  />
                  <span>Popular</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-[#163654] text-xs font-semibold cursor-pointer ${
                    formParentId
                      ? "bg-slate-50 dark:bg-[#071526] text-slate-400 cursor-not-allowed"
                      : "text-slate-800 dark:text-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={Boolean(formParentId)}
                    checked={!formParentId && formShowOnHomepage}
                    onChange={(e) => setFormShowOnHomepage(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-teal-600"
                  />
                  <span>Homepage</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-[#071526]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50 transition shadow-xs"
                >
                  {isPending
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : formParentId
                        ? "Create Subcategory"
                        : "Create Main Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
