"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  DocumentType,
  ProviderType,
  ServiceLifecycleStatus,
  ServiceRequirementAppliesTo,
  ServiceRequirementRow,
  ServiceRequirementType,
} from "@easylife/shared-types";
import type {
  AdminCategoryRecord,
  AdminServiceRecord,
} from "@/lib/supabase/admin-catalogue";
import {
  archiveServiceAction,
  archiveServiceRequirementAction,
  createServiceAction,
  deleteServiceAction,
  reorderServicesAction,
  restoreServiceAction,
  toggleServiceFlagAction,
  toggleServiceHomepageVisibilityAction,
  toggleServiceRequirementAction,
  updateServiceAction,
  updateServiceStatusAction,
  upsertServiceRequirementAction,
} from "@/app/actions/admin-services";

interface AdminServiceManagerProps {
  initialServices: AdminServiceRecord[];
  categories: AdminCategoryRecord[];
  initialCategoryFilter?: string;
  initialSubcategoryFilter?: string;
}

const PROVIDER_TYPE_OPTIONS: Array<{ value: ProviderType; label: string }> = [
  { value: "trade_technician", label: "Trade Technician" },
  { value: "general_artisan", label: "General Artisan" },
  { value: "dispatch_rider", label: "Dispatch & Moving Crew" },
  { value: "property_agent", label: "Property & Facility Agent" },
];

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: "national_id_nin", label: "National ID (NIN)" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "international_passport", label: "International Passport" },
  { value: "trade_certificate", label: "Trade Certificate" },
  { value: "cac_certificate", label: "CAC Business Cert" },
  { value: "utility_bill", label: "Utility Bill" },
  { value: "other", label: "Other Document" },
];

const REQUIREMENT_TYPE_OPTIONS: Array<{
  value: ServiceRequirementType;
  label: string;
}> = [
  { value: "customer_input", label: "Customer Input" },
  { value: "photo_evidence", label: "Photo Evidence" },
  { value: "site_access", label: "Site Access" },
  { value: "provider_credential", label: "Provider Credential" },
  { value: "safety_compliance", label: "Safety Compliance" },
  { value: "equipment_or_tools", label: "Equipment / Tools" },
  { value: "inspection", label: "Site Inspection" },
];

const SERVICE_ICONS = [
  "wrench",
  "zap",
  "wind",
  "settings",
  "sparkles",
  "paintbrush",
  "hammer",
  "shield",
  "sun",
  "grid",
  "car",
  "truck",
  "shirt",
  "scissors",
  "droplets",
  "cpu",
  "tool",
];

type ServiceFilterStatus =
  | "non_archived"
  | "active"
  | "paused"
  | "inactive"
  | "homepage"
  | "hidden_homepage"
  | "featured"
  | "popular"
  | "trade_certified"
  | "archived";

type PendingConfirmAction =
  | { type: "pause"; service: AdminServiceRecord }
  | { type: "deactivate"; service: AdminServiceRecord }
  | { type: "delete"; service: AdminServiceRecord }
  | null;

function resolveServiceStatus(srv: AdminServiceRecord): ServiceLifecycleStatus {
  if (srv.status === "active" || srv.status === "paused" || srv.status === "inactive") {
    return srv.status;
  }
  return srv.is_active ? "active" : "inactive";
}

function formatNairaFromKobo(kobo: number): string {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

function formatAdminPriceDisplay(minKobo: number, maxKobo: number | null): string {
  if ((!minKobo || minKobo <= 0) && (!maxKobo || maxKobo <= 0)) {
    return "Price available on request";
  }
  if (maxKobo && maxKobo > minKobo) {
    return `${formatNairaFromKobo(minKobo)} – ${formatNairaFromKobo(maxKobo)}`;
  }
  return `From ${formatNairaFromKobo(minKobo)}`;
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminServiceManager({
  initialServices,
  categories,
  initialCategoryFilter = "",
  initialSubcategoryFilter = "",
}: AdminServiceManagerProps) {
  const router = useRouter();
  const [services, setServices] = useState<AdminServiceRecord[]>(initialServices);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [subcategoryFilter, setSubcategoryFilter] = useState(
    initialSubcategoryFilter
  );
  const [statusFilter, setStatusFilter] =
    useState<ServiceFilterStatus>("non_archived");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Add/Edit Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<AdminServiceRecord | null>(null);

  const [srvCategoryId, setSrvCategoryId] = useState("");
  const [srvSubcategoryId, setSrvSubcategoryId] = useState("");
  const [srvName, setSrvName] = useState("");
  const [srvCode, setSrvCode] = useState("");
  const [srvSlug, setSrvSlug] = useState("");
  const [srvShortDesc, setSrvShortDesc] = useState("");
  const [srvDesc, setSrvDesc] = useState("");
  const [srvIcon, setSrvIcon] = useState("tool");
  const [srvKeywords, setSrvKeywords] = useState("");
  const [srvDisplayOrder, setSrvDisplayOrder] = useState(1);
  const [srvMinPriceNaira, setSrvMinPriceNaira] = useState("0");
  const [srvMaxPriceNaira, setSrvMaxPriceNaira] = useState("");
  const [srvDurationMins, setSrvDurationMins] = useState("90");
  const [srvCommissionPct, setSrvCommissionPct] = useState("");
  const [srvIsActive, setSrvIsActive] = useState(true);
  const [srvIsFeatured, setSrvIsFeatured] = useState(false);
  const [srvIsPopular, setSrvIsPopular] = useState(false);
  const [srvShowOnHomepage, setSrvShowOnHomepage] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction>(null);
  const [srvReqVerifiedId, setSrvReqVerifiedId] = useState(true);
  const [srvReqTradeCert, setSrvReqTradeCert] = useState(false);
  const [srvReqBusinessReg, setSrvReqBusinessReg] = useState(false);
  const [srvReqSiteInspection, setSrvReqSiteInspection] = useState(false);
  const [srvMinYearsExp, setSrvMinYearsExp] = useState(0);
  const [srvProviderTypes, setSrvProviderTypes] = useState<ProviderType[]>([
    "trade_technician",
  ]);
  const [srvDocumentTypes, setSrvDocumentTypes] = useState<DocumentType[]>([
    "national_id_nin",
  ]);
  const [srvImageUrl, setSrvImageUrl] = useState("");
  const [srvImageFile, setSrvImageFile] = useState<File | null>(null);
  const [srvImagePreview, setSrvImagePreview] = useState<string | null>(null);
  const [srvRemoveImage, setSrvRemoveImage] = useState(false);

  // Requirements Modal State
  const [requirementsServiceId, setRequirementsServiceId] = useState<string | null>(
    null
  );
  const [showArchivedReqs, setShowArchivedReqs] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqKey, setReqKey] = useState("");
  const [reqType, setReqType] =
    useState<ServiceRequirementType>("customer_input");
  const [reqAppliesTo, setReqAppliesTo] =
    useState<ServiceRequirementAppliesTo>("both");
  const [reqTitle, setReqTitle] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqDisplayOrder, setReqDisplayOrder] = useState(1);
  const [reqIsRequired, setReqIsRequired] = useState(true);
  const [reqIsActive, setReqIsActive] = useState(true);
  const [reqConfigJson, setReqConfigJson] = useState("{}");

  useEffect(() => {
    return () => {
      if (srvImagePreview && srvImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(srvImagePreview);
      }
    };
  }, [srvImagePreview]);

  const mainCategories = useMemo(
    () =>
      categories
        .filter((c) => !c.parent_id && !c.deleted_at)
        .sort(
          (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)
        ),
    [categories]
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filterSubcategories = useMemo(() => {
    if (!categoryFilter) return [];
    return categories
      .filter((c) => c.parent_id === categoryFilter && !c.deleted_at)
      .sort(
        (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)
      );
  }, [categories, categoryFilter]);

  const modalSubcategories = useMemo(() => {
    if (!srvCategoryId) return [];
    return categories
      .filter((c) => c.parent_id === srvCategoryId && !c.deleted_at)
      .sort(
        (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)
      );
  }, [categories, srvCategoryId]);

  const kpis = useMemo(() => {
    const nonArchived = services.filter((s) => !s.deleted_at);
    const active = nonArchived.filter((s) => resolveServiceStatus(s) === "active").length;
    const paused = nonArchived.filter((s) => resolveServiceStatus(s) === "paused").length;
    const inactive = nonArchived.filter((s) => resolveServiceStatus(s) === "inactive").length;
    const onHomepage = nonArchived.filter((s) => s.show_on_homepage).length;
    const hiddenHomepage = nonArchived.length - onHomepage;
    const regulated = nonArchived.filter(
      (s) => s.requires_trade_certification || s.requires_business_registration
    ).length;
    const reqCount = nonArchived.reduce(
      (acc, s) =>
        acc + (s.requirements || []).filter((r) => !r.deleted_at && r.is_active).length,
      0
    );
    return {
      total: nonArchived.length,
      active,
      paused,
      inactive,
      onHomepage,
      hiddenHomepage,
      regulated,
      reqCount,
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return services
      .filter((srv) => {
        const lifecycle = resolveServiceStatus(srv);
        if (statusFilter === "archived") {
          if (!srv.deleted_at) return false;
        } else {
          if (srv.deleted_at) return false;
          if (statusFilter === "active" && lifecycle !== "active") return false;
          if (statusFilter === "paused" && lifecycle !== "paused") return false;
          if (statusFilter === "inactive" && lifecycle !== "inactive") return false;
          if (statusFilter === "featured" && !srv.is_featured) return false;
          if (statusFilter === "popular" && !srv.is_popular) return false;
          if (statusFilter === "homepage" && !srv.show_on_homepage) return false;
          if (statusFilter === "hidden_homepage" && srv.show_on_homepage) return false;
          if (
            statusFilter === "trade_certified" &&
            !srv.requires_trade_certification
          ) {
            return false;
          }
        }

        if (categoryFilter && srv.category_id !== categoryFilter) return false;
        if (subcategoryFilter && srv.subcategory_id !== subcategoryFilter) {
          return false;
        }

        if (q) {
          const hay = [
            srv.name,
            srv.service_code,
            srv.slug,
            srv.short_description || "",
            ...(srv.keywords || []),
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort(
        (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)
      );
  }, [services, statusFilter, categoryFilter, subcategoryFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedServices = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, safePage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, subcategoryFilter, statusFilter, pageSize]);

  const resetServiceImage = (existingUrl: string | null | undefined) => {
    if (srvImagePreview && srvImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(srvImagePreview);
    }
    setSrvImageFile(null);
    setSrvRemoveImage(false);
    setSrvImageUrl(existingUrl || "");
    setSrvImagePreview(existingUrl || null);
  };

  const openAddServiceModal = () => {
    const defaultCatId = categoryFilter || mainCategories[0]?.id || "";
    setEditingService(null);
    setSrvCategoryId(defaultCatId);
    setSrvSubcategoryId(subcategoryFilter || "");
    setSrvName("");
    setSrvCode("");
    setSrvSlug("");
    setSrvShortDesc("");
    setSrvDesc("");
    setSrvIcon("tool");
    setSrvKeywords("");
    setSrvDisplayOrder(
      services.filter(
        (s) => !s.deleted_at && (!defaultCatId || s.category_id === defaultCatId)
      ).length + 1
    );
    setSrvMinPriceNaira("0");
    setSrvMaxPriceNaira("");
    setSrvDurationMins("90");
    setSrvCommissionPct("");
    setSrvIsActive(true);
    setSrvIsFeatured(false);
    setSrvIsPopular(false);
    setSrvShowOnHomepage(false);
    setSrvReqVerifiedId(true);
    setSrvReqTradeCert(false);
    setSrvReqBusinessReg(false);
    setSrvReqSiteInspection(false);
    setSrvMinYearsExp(0);
    setSrvProviderTypes(["trade_technician"]);
    setSrvDocumentTypes(["national_id_nin"]);
    resetServiceImage(null);
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (srv: AdminServiceRecord) => {
    setEditingService(srv);
    setSrvCategoryId(srv.category_id);
    setSrvSubcategoryId(srv.subcategory_id || "");
    setSrvName(srv.name);
    setSrvCode(srv.service_code);
    setSrvSlug(srv.slug);
    setSrvShortDesc(srv.short_description || "");
    setSrvDesc(srv.description || "");
    setSrvIcon(srv.icon_name || "tool");
    setSrvKeywords((srv.keywords || []).join(", "));
    setSrvDisplayOrder(srv.display_order || 0);
    setSrvMinPriceNaira(String(Math.round((srv.base_price_min_kobo || 0) / 100)));
    setSrvMaxPriceNaira(
      srv.base_price_max_kobo !== null
        ? String(Math.round(srv.base_price_max_kobo / 100))
        : ""
    );
    setSrvDurationMins(
      srv.estimated_duration_minutes !== null
        ? String(srv.estimated_duration_minutes)
        : ""
    );
    setSrvCommissionPct(
      srv.default_commission_bps !== null
        ? String(srv.default_commission_bps / 100)
        : ""
    );
    setSrvIsActive(srv.is_active);
    setSrvIsFeatured(srv.is_featured);
    setSrvIsPopular(srv.is_popular);
    setSrvShowOnHomepage(srv.show_on_homepage);
    setSrvReqVerifiedId(srv.requires_verified_identity);
    setSrvReqTradeCert(srv.requires_trade_certification);
    setSrvReqBusinessReg(srv.requires_business_registration);
    setSrvReqSiteInspection(srv.requires_site_inspection);
    setSrvMinYearsExp(srv.min_years_experience || 0);
    setSrvProviderTypes(
      srv.eligible_provider_types.length > 0
        ? srv.eligible_provider_types
        : ["trade_technician"]
    );
    setSrvDocumentTypes(
      srv.required_document_types.length > 0
        ? srv.required_document_types
        : ["national_id_nin"]
    );
    resetServiceImage(srv.image_url);
    setIsServiceModalOpen(true);
  };

  const toggleProviderType = (pt: ProviderType) => {
    setSrvProviderTypes((prev) =>
      prev.includes(pt) ? prev.filter((item) => item !== pt) : [...prev, pt]
    );
  };

  const toggleDocumentType = (dt: DocumentType) => {
    setSrvDocumentTypes((prev) =>
      prev.includes(dt) ? prev.filter((item) => item !== dt) : [...prev, dt]
    );
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (srvProviderTypes.length === 0) {
      setFeedback({
        type: "error",
        text: "Please select at least one eligible provider type.",
      });
      return;
    }

    const formData = new FormData();
    if (editingService) formData.append("id", editingService.id);
    formData.append("categoryId", srvCategoryId);
    formData.append("subcategoryId", srvSubcategoryId);
    formData.append("name", srvName);
    formData.append("serviceCode", srvCode);
    formData.append("slug", srvSlug);
    formData.append("shortDescription", srvShortDesc);
    formData.append("description", srvDesc);
    formData.append("iconName", srvIcon);
    formData.append("keywords", srvKeywords);
    formData.append("displayOrder", String(srvDisplayOrder));
    formData.append("basePriceMinNaira", srvMinPriceNaira || "0");
    formData.append("basePriceMaxNaira", srvMaxPriceNaira);
    formData.append("estimatedDurationMinutes", srvDurationMins);
    if (srvCommissionPct.trim() !== "") {
      const commNum = Number.parseFloat(srvCommissionPct);
      formData.append(
        "defaultCommissionBps",
        Number.isFinite(commNum) ? String(Math.round(commNum * 100)) : ""
      );
    } else {
      formData.append("defaultCommissionBps", "");
    }
    formData.append("isActive", srvIsActive ? "true" : "false");
    formData.append("isFeatured", srvIsFeatured ? "true" : "false");
    formData.append("isPopular", srvIsPopular ? "true" : "false");
    formData.append("showOnHomepage", srvShowOnHomepage ? "true" : "false");
    formData.append(
      "requiresVerifiedIdentity",
      srvReqVerifiedId ? "true" : "false"
    );
    formData.append(
      "requiresTradeCertification",
      srvReqTradeCert ? "true" : "false"
    );
    formData.append(
      "requiresBusinessRegistration",
      srvReqBusinessReg ? "true" : "false"
    );
    formData.append(
      "requiresSiteInspection",
      srvReqSiteInspection ? "true" : "false"
    );
    formData.append("minYearsExperience", String(srvMinYearsExp));

    for (const pt of srvProviderTypes) {
      formData.append("eligibleProviderTypes", pt);
    }
    for (const dt of srvDocumentTypes) {
      formData.append("requiredDocumentTypes", dt);
    }

    formData.append("imageUrl", srvImageUrl);
    if (srvRemoveImage) formData.append("removeImage", "true");
    if (srvImageFile) formData.append("imageFile", srvImageFile);

    startTransition(async () => {
      const res = editingService
        ? await updateServiceAction({ status: "idle", message: "" }, formData)
        : await createServiceAction({ status: "idle", message: "" }, formData);

      if (res.status === "error") {
        setFeedback({ type: "error", text: res.message });
      } else {
        setFeedback({ type: "success", text: res.message });
        setIsServiceModalOpen(false);
        if (res.data) {
          const saved = res.data;
          setServices((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            if (exists) {
              return prev.map((s) =>
                s.id === saved.id ? { ...s, ...saved } : s
              );
            }
            const added: AdminServiceRecord = {
              ...saved,
              requirements: [],
              professional_service_count: 0,
              booking_count: 0,
            };
            return [...prev, added];
          });
        }
        router.refresh();
      }
    });
  };

  const handleToggleServiceFlag = (
    srv: AdminServiceRecord,
    field: "is_active" | "is_featured" | "is_popular" | "show_on_homepage"
  ) => {
    const nextVal = !srv[field];
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleServiceFlagAction(srv.id, field, nextVal);
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === srv.id ? { ...s, [field]: nextVal } : s))
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleChangeServiceStatus = (
    srv: AdminServiceRecord,
    nextStatus: ServiceLifecycleStatus
  ) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateServiceStatusAction(srv.id, nextStatus);
      if (res.ok && res.data) {
        const updated = res.data;
        setServices((prev) =>
          prev.map((s) =>
            s.id === srv.id
              ? {
                  ...s,
                  status: updated.status,
                  is_active: updated.is_active,
                  paused_at: updated.paused_at,
                  deactivated_at: updated.deactivated_at,
                  updated_at: updated.updated_at,
                }
              : s
          )
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleToggleHomepage = (srv: AdminServiceRecord) => {
    const nextVal = !srv.show_on_homepage;
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleServiceHomepageVisibilityAction(srv.id, nextVal);
      if (res.ok && res.data) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === srv.id
              ? {
                  ...s,
                  show_on_homepage: res.data!.show_on_homepage,
                  updated_at: res.data!.updated_at,
                }
              : s
          )
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleDeleteService = (srv: AdminServiceRecord) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteServiceAction(srv.id, true);
      if (res.ok) {
        if (res.mode === "hard_deleted") {
          setServices((prev) => prev.filter((s) => s.id !== srv.id));
        } else {
          setServices((prev) =>
            prev.map((s) =>
              s.id === srv.id
                ? {
                    ...s,
                    status: "inactive",
                    is_active: false,
                    show_on_homepage: false,
                    deleted_at: new Date().toISOString(),
                  }
                : s
            )
          );
        }
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const executePendingConfirm = () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);
    if (action.type === "pause") {
      handleChangeServiceStatus(action.service, "paused");
    } else if (action.type === "deactivate") {
      handleChangeServiceStatus(action.service, "inactive");
    } else if (action.type === "delete") {
      handleDeleteService(action.service);
    }
  };

  const handleReorderFiltered = (indexInFiltered: number, direction: "up" | "down") => {
    const targetIdx =
      direction === "up" ? indexInFiltered - 1 : indexInFiltered + 1;
    if (targetIdx < 0 || targetIdx >= filteredServices.length) return;

    const list = [...filteredServices];
    const current = list[indexInFiltered]!;
    list[indexInFiltered] = list[targetIdx]!;
    list[targetIdx] = current;

    const orders = list.map((s, i) => ({ id: s.id, display_order: i + 1 }));
    const orderMap = new Map(orders.map((o) => [o.id, o.display_order]));

    setServices((prev) =>
      prev.map((s) =>
        orderMap.has(s.id) ? { ...s, display_order: orderMap.get(s.id)! } : s
      )
    );

    startTransition(async () => {
      const res = await reorderServicesAction(orders);
      if (!res.ok) {
        setFeedback({ type: "error", text: res.message });
      } else {
        router.refresh();
      }
    });
  };

  const handleArchiveService = (srv: AdminServiceRecord) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await archiveServiceAction(srv.id);
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === srv.id
              ? {
                  ...s,
                  is_active: false,
                  show_on_homepage: false,
                  deleted_at: new Date().toISOString(),
                }
              : s
          )
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleRestoreService = (srv: AdminServiceRecord) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await restoreServiceAction(srv.id);
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === srv.id ? { ...s, deleted_at: null, is_active: false } : s
          )
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  // Requirement Modal Helpers
  const activeReqService = useMemo(
    () => services.find((s) => s.id === requirementsServiceId) ?? null,
    [services, requirementsServiceId]
  );

  const resetReqForm = (service: AdminServiceRecord | null) => {
    setEditingReqId(null);
    setReqKey("");
    setReqType("customer_input");
    setReqAppliesTo("both");
    setReqTitle("");
    setReqDesc("");
    setReqDisplayOrder((service?.requirements.length || 0) + 1);
    setReqIsRequired(true);
    setReqIsActive(true);
    setReqConfigJson("{}");
  };

  const openRequirementsModal = (srv: AdminServiceRecord) => {
    setRequirementsServiceId(srv.id);
    setShowArchivedReqs(false);
    resetReqForm(srv);
  };

  const startEditingReq = (req: ServiceRequirementRow) => {
    setEditingReqId(req.id);
    setReqKey(req.requirement_key);
    setReqType(req.requirement_type);
    setReqAppliesTo(req.applies_to);
    setReqTitle(req.title);
    setReqDesc(req.description || "");
    setReqDisplayOrder(req.display_order || 1);
    setReqIsRequired(req.is_required);
    setReqIsActive(req.is_active);
    setReqConfigJson(JSON.stringify(req.config || {}, null, 2));
  };

  const handleSaveRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReqService) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await upsertServiceRequirementAction({
        id: editingReqId || undefined,
        serviceId: activeReqService.id,
        requirementKey: reqKey,
        requirementType: reqType,
        appliesTo: reqAppliesTo,
        title: reqTitle,
        description: reqDesc,
        isRequired: reqIsRequired,
        isActive: reqIsActive,
        displayOrder: reqDisplayOrder,
        configJson: reqConfigJson,
      });

      if (!res.ok) {
        setFeedback({ type: "error", text: res.message });
      } else {
        setFeedback({ type: "success", text: res.message });
        if (res.data) {
          const savedReq = res.data;
          setServices((prev) =>
            prev.map((s) => {
              if (s.id !== activeReqService.id) return s;
              const exists = s.requirements.some((r) => r.id === savedReq.id);
              const nextReqs = exists
                ? s.requirements.map((r) => (r.id === savedReq.id ? savedReq : r))
                : [...s.requirements, savedReq];
              return {
                ...s,
                requirements: nextReqs.sort(
                  (a, b) => a.display_order - b.display_order
                ),
              };
            })
          );
        }
        resetReqForm(activeReqService);
        router.refresh();
      }
    });
  };

  const handleToggleReqFlag = (
    req: ServiceRequirementRow,
    field: "is_active" | "is_required"
  ) => {
    if (!activeReqService) return;
    const nextVal = !req[field];
    startTransition(async () => {
      const res = await toggleServiceRequirementAction(req.id, field, nextVal);
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === activeReqService.id
              ? {
                  ...s,
                  requirements: s.requirements.map((r) =>
                    r.id === req.id ? { ...r, [field]: nextVal } : r
                  ),
                }
              : s
          )
        );
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  const handleArchiveReq = (req: ServiceRequirementRow) => {
    if (!activeReqService) return;
    startTransition(async () => {
      const res = await archiveServiceRequirementAction(req.id);
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === activeReqService.id
              ? {
                  ...s,
                  requirements: s.requirements.map((r) =>
                    r.id === req.id
                      ? {
                          ...r,
                          is_active: false,
                          deleted_at: new Date().toISOString(),
                        }
                      : r
                  ),
                }
              : s
          )
        );
        setFeedback({ type: "success", text: res.message });
        router.refresh();
      } else {
        setFeedback({ type: "error", text: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Catalogue Services
          </div>
          <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.total}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              {kpis.active} active
            </span>
            {kpis.paused > 0 && (
              <span className="text-xs font-semibold text-amber-700">
                • {kpis.paused} paused
              </span>
            )}
            {kpis.inactive > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                • {kpis.inactive} inactive
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Homepage Visibility
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.onHomepage}
            </span>
            <span className="text-xs font-medium text-slate-500">
              shown • {kpis.hiddenHomepage} hidden
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Credential-Gated
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.regulated}
            </span>
            <span className="text-xs font-medium text-amber-700">
              require cert / CAC
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Service Rules
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.reqCount}
            </span>
            <span className="text-xs font-medium text-slate-500">
              configured checks
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-4">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service name, EL-code, slug, keywords..."
              className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubcategoryFilter("");
              }}
              aria-label="Filter by main category"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800"
            >
              <option value="">All Main Categories</option>
              {mainCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={subcategoryFilter}
              disabled={!categoryFilter || filterSubcategories.length === 0}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              aria-label="Filter by subcategory"
              className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {categoryFilter
                  ? filterSubcategories.length > 0
                    ? "All Subcategories in Category"
                    : "No Subcategories"
                  : "Select Category for Subcategories"}
              </option>
              {filterSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={openAddServiceModal}
              className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] transition shadow-xs"
            >
              + Add Service
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["non_archived", `All Services (${kpis.total})`],
                ["active", `Active (${kpis.active})`],
                ["paused", `Paused (${kpis.paused})`],
                ["inactive", `Inactive (${kpis.inactive})`],
                ["homepage", `On Homepage (${kpis.onHomepage})`],
                ["hidden_homepage", `Hidden from Homepage (${kpis.hiddenHomepage})`],
                ["featured", "Featured"],
                ["trade_certified", "Trade Cert Required"],
                [
                  "archived",
                  `Archived (${services.filter((s) => Boolean(s.deleted_at)).length})`,
                ],
              ] as Array<[ServiceFilterStatus, string]>
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                  statusFilter === val
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing {filteredServices.length} services</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Rows per page"
              className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
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

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-20 text-center">Order</th>
                <th className="py-3 px-4 min-w-[260px]">
                  Service &amp; Classification
                </th>
                <th className="py-3 px-4 min-w-[175px]">Pricing &amp; Dates</th>
                <th className="py-3 px-4 min-w-[200px]">
                  Eligibility Rules
                </th>
                <th className="py-3 px-4 min-w-[190px]">
                  Status &amp; Homepage
                </th>
                <th className="py-3 px-4 text-right min-w-[290px]">
                  Administrative Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {pagedServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    No catalogue services match the selected filters.
                  </td>
                </tr>
              ) : (
                pagedServices.map((srv, idxOnPage) => {
                  const globalFilteredIndex =
                    (safePage - 1) * pageSize + idxOnPage;
                  const mainCat = categoryMap.get(srv.category_id);
                  const subCat = srv.subcategory_id
                    ? categoryMap.get(srv.subcategory_id)
                    : null;
                  const activeReqsCount = (srv.requirements || []).filter(
                    (r) => !r.deleted_at
                  ).length;
                  const lifecycle = resolveServiceStatus(srv);

                  return (
                    <tr key={srv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-center">
                        {srv.deleted_at ? (
                          <span className="text-[11px] font-mono text-slate-400">
                            Archived
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1 font-mono font-bold text-slate-500">
                            <span>#{srv.display_order}</span>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={globalFilteredIndex <= 0 || isPending}
                                onClick={() =>
                                  handleReorderFiltered(globalFilteredIndex, "up")
                                }
                                className="text-[9px] leading-none p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-20"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={
                                  globalFilteredIndex >=
                                    filteredServices.length - 1 || isPending
                                }
                                onClick={() =>
                                  handleReorderFiltered(
                                    globalFilteredIndex,
                                    "down"
                                  )
                                }
                                className="text-[9px] leading-none p-0.5 text-slate-400 hover:text-slate-900 disabled:opacity-20"
                                title="Move Down"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          {srv.image_url ? (
                            <img
                              src={srv.image_url}
                              alt={srv.name}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                              {srv.icon_name || "tool"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-900">
                              {srv.name}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                                {srv.service_code}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                /{srv.slug}
                              </span>
                            </div>
                            <div className="text-[11px] text-teal-800 font-semibold mt-1">
                              {mainCat?.name || "Category"}
                              {subCat ? ` → ${subCat.name}` : ""}
                            </div>
                            {srv.short_description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                {srv.short_description}
                              </p>
                            )}
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {srv.professional_service_count} linked pros •{" "}
                              {srv.booking_count} bookings
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatAdminPriceDisplay(
                            srv.base_price_min_kobo,
                            srv.base_price_max_kobo
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {srv.estimated_duration_minutes
                            ? `Est. ${srv.estimated_duration_minutes} mins`
                            : "Flexible duration"}
                        </div>
                        {srv.default_commission_bps !== null && (
                          <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                            Fee override:{" "}
                            {(srv.default_commission_bps / 100).toFixed(1)}%
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1.5 space-y-0.5">
                          <div>Created: {formatShortDate(srv.created_at)}</div>
                          <div>Updated: {formatShortDate(srv.updated_at)}</div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {srv.requires_verified_identity && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              Verified ID
                            </span>
                          )}
                          {srv.requires_trade_certification && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                              Trade Cert
                            </span>
                          )}
                          {srv.requires_business_registration && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-[10px] font-bold">
                              CAC Reg
                            </span>
                          )}
                          {srv.requires_site_inspection && (
                            <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-900 border border-sky-200 text-[10px] font-bold">
                              Site Inspect
                            </span>
                          )}
                          {srv.min_years_experience > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              ≥{srv.min_years_experience}y exp
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1.5">
                          Providers:{" "}
                          {srv.eligible_provider_types
                            .map((p) => p.replace(/_/g, " "))
                            .join(", ")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {srv.deleted_at ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">
                            Archived
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Service Operational Status Badge */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {lifecycle === "active" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              )}
                              {lifecycle === "paused" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Paused
                                </span>
                              )}
                              {lifecycle === "inactive" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-[11px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                  Inactive
                                </span>
                              )}
                            </div>

                            {/* Independent Homepage Visibility Indicator */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {srv.show_on_homepage ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">
                                  Shown on Homepage
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                                  Hidden from Homepage
                                </span>
                              )}
                            </div>

                            {/* Featured / Popular quick flags */}
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleToggleServiceFlag(srv, "is_featured")
                                }
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  srv.is_featured
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
                                }`}
                              >
                                Featured
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleToggleServiceFlag(srv, "is_popular")
                                }
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  srv.is_popular
                                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                    : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
                                }`}
                              >
                                Popular
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          {srv.deleted_at ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleRestoreService(srv)}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[11px] font-bold text-teal-800 hover:bg-teal-100"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              {/* Status-aware Lifecycle Actions */}
                              {lifecycle === "active" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() =>
                                      setPendingConfirm({
                                        type: "pause",
                                        service: srv,
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                                  >
                                    Pause
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() =>
                                      setPendingConfirm({
                                        type: "deactivate",
                                        service: srv,
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                                  >
                                    Deactivate
                                  </button>
                                </>
                              )}

                              {lifecycle === "paused" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() =>
                                      handleChangeServiceStatus(srv, "active")
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                                  >
                                    Resume
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() =>
                                      setPendingConfirm({
                                        type: "deactivate",
                                        service: srv,
                                      })
                                    }
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40"
                                  >
                                    Deactivate
                                  </button>
                                </>
                              )}

                              {lifecycle === "inactive" && (
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleChangeServiceStatus(srv, "active")
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                                >
                                  Activate
                                </button>
                              )}

                              {/* Independent Homepage Visibility Control */}
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleToggleHomepage(srv)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition disabled:opacity-40 ${
                                  srv.show_on_homepage
                                    ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                                    : "bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100"
                                }`}
                              >
                                {srv.show_on_homepage
                                  ? "Hide from Homepage"
                                  : "Show on Homepage"}
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditServiceModal(srv)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => openRequirementsModal(srv)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Rules ({activeReqsCount})
                              </button>

                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  setPendingConfirm({
                                    type: "delete",
                                    service: srv,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-red-200 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingService
                    ? `Edit Service: ${editingService.name}`
                    : "Create New Catalogue Service"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure hierarchy, pricing band, image, visibility, and provider eligibility rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-6">
              {/* Section 1: Hierarchy & Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                  1. Hierarchy &amp; Identification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Main Category *
                    </label>
                    <select
                      required
                      value={srvCategoryId}
                      onChange={(e) => {
                        setSrvCategoryId(e.target.value);
                        setSrvSubcategoryId("");
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900"
                    >
                      <option value="">Select Main Category...</option>
                      {mainCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subcategory (optional)
                    </label>
                    <select
                      value={srvSubcategoryId}
                      disabled={modalSubcategories.length === 0}
                      onChange={(e) => setSrvSubcategoryId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <option value="">
                        {modalSubcategories.length > 0
                          ? "Direct under Main Category (None)"
                          : "No Subcategories in Selected Category"}
                      </option>
                      {modalSubcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={srvName}
                      onChange={(e) => setSrvName(e.target.value)}
                      placeholder="e.g. Split AC Gas Refill"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Service Code (auto if blank)
                    </label>
                    <input
                      type="text"
                      value={srvCode}
                      onChange={(e) => setSrvCode(e.target.value)}
                      placeholder="e.g. EL-HVAC-001"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Slug (auto if blank)
                    </label>
                    <input
                      type="text"
                      value={srvSlug}
                      onChange={(e) => setSrvSlug(e.target.value)}
                      placeholder="e.g. split-ac-gas-refill"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Content & Media */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                  2. Descriptions, Keywords &amp; Media
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={srvShortDesc}
                    onChange={(e) => setSrvShortDesc(e.target.value)}
                    placeholder="Concise summary displayed on service cards..."
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Service Scope &amp; Details
                  </label>
                  <textarea
                    rows={3}
                    value={srvDesc}
                    onChange={(e) => setSrvDesc(e.target.value)}
                    placeholder="What is included, exclusions, tools brought by professional..."
                    className="w-full p-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Search Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={srvKeywords}
                      onChange={(e) => setSrvKeywords(e.target.value)}
                      placeholder="e.g. ac gas, r410a, cooling, split unit"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Icon
                    </label>
                    <select
                      value={srvIcon}
                      onChange={(e) => setSrvIcon(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                    >
                      {SERVICE_ICONS.map((ic) => (
                        <option key={ic} value={ic}>
                          {ic}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Service Image (PNG / JPG / WEBP, max 5 MB)
                    </span>
                    {srvImagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          resetServiceImage(null);
                          setSrvRemoveImage(true);
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {srvImagePreview ? (
                      <img
                        src={srvImagePreview}
                        alt="Service preview"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                        No img
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (srvImagePreview && srvImagePreview.startsWith("blob:")) {
                            URL.revokeObjectURL(srvImagePreview);
                          }
                          setSrvImageFile(file);
                          setSrvRemoveImage(false);
                          setSrvImagePreview(URL.createObjectURL(file));
                        }}
                        className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-800 hover:file:bg-teal-100"
                      />
                      <input
                        type="text"
                        value={srvImageUrl}
                        onChange={(e) => {
                          setSrvImageUrl(e.target.value);
                          setSrvRemoveImage(false);
                          if (!srvImageFile) {
                            setSrvImagePreview(e.target.value.trim() || null);
                          }
                        }}
                        placeholder="Or paste image URL / /path..."
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Pricing & Visibility */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                  3. Pricing Guidance, Commission &amp; Visibility
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Min Price (₦) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={srvMinPriceNaira}
                      onChange={(e) => setSrvMinPriceNaira(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Price (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={srvMaxPriceNaira}
                      onChange={(e) => setSrvMaxPriceNaira(e.target.value)}
                      placeholder="Optional"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Est. Mins
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={srvDurationMins}
                      onChange={(e) => setSrvDurationMins(e.target.value)}
                      placeholder="e.g. 90"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fee Override (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={srvCommissionPct}
                      onChange={(e) => setSrvCommissionPct(e.target.value)}
                      placeholder="Inherit"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={srvDisplayOrder}
                      onChange={(e) =>
                        setSrvDisplayOrder(parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvIsActive}
                      onChange={(e) => setSrvIsActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvIsFeatured}
                      onChange={(e) => setSrvIsFeatured(e.target.checked)}
                    />
                    <span>Featured</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvIsPopular}
                      onChange={(e) => setSrvIsPopular(e.target.checked)}
                    />
                    <span>Popular</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvShowOnHomepage}
                      onChange={(e) => setSrvShowOnHomepage(e.target.checked)}
                    />
                    <span>Show Homepage</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Provider Eligibility & Verification Rules */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                  4. Provider Eligibility &amp; Verification Requirements
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvReqVerifiedId}
                      onChange={(e) => setSrvReqVerifiedId(e.target.checked)}
                    />
                    <span>Verified ID</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvReqTradeCert}
                      onChange={(e) => setSrvReqTradeCert(e.target.checked)}
                    />
                    <span>Trade Cert</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvReqBusinessReg}
                      onChange={(e) => setSrvReqBusinessReg(e.target.checked)}
                    />
                    <span>CAC Reg</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srvReqSiteInspection}
                      onChange={(e) => setSrvReqSiteInspection(e.target.checked)}
                    />
                    <span>Site Inspect</span>
                  </label>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Min Years Exp.
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={srvMinYearsExp}
                      onChange={(e) =>
                        setSrvMinYearsExp(parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1.5">
                    Eligible Provider Types *
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PROVIDER_TYPE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={srvProviderTypes.includes(opt.value)}
                          onChange={() => toggleProviderType(opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1.5">
                    Required Verification Document Types
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={srvDocumentTypes.includes(opt.value)}
                          onChange={() => toggleDocumentType(opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                    : editingService
                      ? "Update Service"
                      : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Requirements Modal */}
      {activeReqService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold uppercase">
                  Per-Service Requirements
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  {activeReqService.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {activeReqService.service_code} • Configure intake questions, photo rules, safety checks &amp; credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequirementsServiceId(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Existing Requirements List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Configured Requirements
                </h4>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchivedReqs}
                    onChange={(e) => setShowArchivedReqs(e.target.checked)}
                  />
                  <span>Show archived</span>
                </label>
              </div>

              {activeReqService.requirements.filter(
                (r) => showArchivedReqs || !r.deleted_at
              ).length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No specific requirements configured yet for this service. Use the form below to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeReqService.requirements
                    .filter((r) => showArchivedReqs || !r.deleted_at)
                    .map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              #{req.display_order}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {req.title}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-600">
                              {req.requirement_key}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 text-[10px] font-bold">
                              {req.requirement_type.replace(/_/g, " ")}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[10px] font-semibold">
                              {req.applies_to}
                            </span>
                          </div>
                          {req.description && (
                            <p className="text-xs text-slate-600">
                              {req.description}
                            </p>
                          )}
                        </div>

                        {!req.deleted_at && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleToggleReqFlag(req, "is_required")
                              }
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                                req.is_required
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-white text-slate-500 border-slate-200"
                              }`}
                            >
                              {req.is_required ? "Required" : "Optional"}
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleToggleReqFlag(req, "is_active")
                              }
                              className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                                req.is_active
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {req.is_active ? "Active" : "Disabled"}
                            </button>
                            <button
                              type="button"
                              onClick={() => startEditingReq(req)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleArchiveReq(req)}
                              className="px-2.5 py-1 rounded-lg border border-red-200 bg-white text-[11px] font-semibold text-red-700 hover:bg-red-50"
                            >
                              Archive
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Add / Edit Requirement Form */}
            <form
              onSubmit={handleSaveRequirement}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                  {editingReqId
                    ? "Edit Requirement Rule"
                    : "+ Add New Requirement Rule"}
                </h4>
                {editingReqId && (
                  <button
                    type="button"
                    onClick={() => resetReqForm(activeReqService)}
                    className="text-xs font-semibold text-slate-600 hover:underline"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="e.g. Upload Inverter Wattage Photo"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requirement Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqKey}
                    onChange={(e) => setReqKey(e.target.value)}
                    placeholder="e.g. inverter_wattage_photo"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reqDisplayOrder}
                    onChange={(e) =>
                      setReqDisplayOrder(parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requirement Type
                  </label>
                  <select
                    value={reqType}
                    onChange={(e) =>
                      setReqType(e.target.value as ServiceRequirementType)
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  >
                    {REQUIREMENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Applies To
                  </label>
                  <select
                    value={reqAppliesTo}
                    onChange={(e) =>
                      setReqAppliesTo(
                        e.target.value as ServiceRequirementAppliesTo
                      )
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                  >
                    <option value="both">Both Customer &amp; Professional</option>
                    <option value="customer">Customer Only</option>
                    <option value="professional">Professional Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Guidance
                </label>
                <input
                  type="text"
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Instructions displayed to the customer or provider..."
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Structured Config (JSON object)
                </label>
                <textarea
                  rows={2}
                  value={reqConfigJson}
                  onChange={(e) => setReqConfigJson(e.target.value)}
                  placeholder='{"min_photos": 1}'
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reqIsRequired}
                      onChange={(e) => setReqIsRequired(e.target.checked)}
                    />
                    <span>Mandatory</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reqIsActive}
                      onChange={(e) => setReqIsActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-bold hover:bg-[#0F766E] disabled:opacity-50"
                >
                  {isPending
                    ? "Saving..."
                    : editingReqId
                      ? "Update Requirement"
                      : "Add Requirement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Pause, Deactivate, and Delete */}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {pendingConfirm.type === "pause" && "Pause Service?"}
                {pendingConfirm.type === "deactivate" && "Deactivate Service?"}
                {pendingConfirm.type === "delete" && "Delete Service?"}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {pendingConfirm.type === "pause" && (
                  <>
                    Pausing{" "}
                    <strong className="text-slate-900">
                      {pendingConfirm.service.name}
                    </strong>{" "}
                    will temporarily disable new booking and quotation requests while keeping the service saved in the database. You can resume it at any time.
                  </>
                )}
                {pendingConfirm.type === "deactivate" && (
                  <>
                    Deactivating{" "}
                    <strong className="text-slate-900">
                      {pendingConfirm.service.name}
                    </strong>{" "}
                    makes it unavailable to customers while keeping all service records stored safely in the database. You can reactivate it at any time.
                  </>
                )}
                {pendingConfirm.type === "delete" && (
                  <>
                    Are you sure you want to delete{" "}
                    <strong className="text-slate-900">
                      {pendingConfirm.service.name}
                    </strong>
                    ? Services without linked bookings or providers are permanently removed; services with historical records are safely archived to preserve data integrity.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={executePendingConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-50 ${
                  pendingConfirm.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : pendingConfirm.type === "pause"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {pendingConfirm.type === "pause" && "Confirm Pause"}
                {pendingConfirm.type === "deactivate" && "Confirm Deactivate"}
                {pendingConfirm.type === "delete" && "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
