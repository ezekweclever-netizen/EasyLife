import type { IconName } from "@/components/site/icons";

const VALID_ICON_NAMES = new Set<IconName>([
  "search",
  "shield",
  "chat",
  "calendar",
  "star",
  "receipt",
  "building",
  "wrench",
  "zap",
  "wind",
  "settings",
  "hammer",
  "sparkles",
  "paintbrush",
  "cpu",
  "check",
  "clipboard",
  "users",
  "map-pin",
  "lock",
  "scale",
  "arrow-right",
  "menu",
  "close",
  "mail",
  "file",
  "file-text",
  "briefcase",
  "clock",
  "grid",
  "car",
  "truck",
  "shirt",
  "scissors",
  "check-circle",
  "sun",
]);

const SLUG_ICON_MAP: Record<string, IconName> = {
  "plumbing-water-systems": "wrench",
  "electrical-power-backup": "zap",
  "hvac-air-conditioning": "wind",
  "generator-maintenance": "settings",
  "carpentry-doors-locks": "hammer",
  "cleaning-fumigation": "sparkles",
  "painting-wall-finishing": "paintbrush",
  "appliance-repair": "cpu",
  "pest-control-fumigation": "shield",
  "solar-inverter-systems": "sun",
  "tiling-floor-installation": "grid",
  "auto-electrical-services": "car",
  "moving-relocation-services": "truck",
  "laundry-dry-cleaning": "shirt",
  "beauty-personal-care": "scissors",
  "event-planning-services": "calendar",
  "everyday-tasks": "clipboard",
};

export function resolveCatalogueIcon(
  iconName?: string | null,
  categorySlug?: string | null
): IconName {
  if (iconName && VALID_ICON_NAMES.has(iconName as IconName)) {
    return iconName as IconName;
  }
  if (categorySlug && SLUG_ICON_MAP[categorySlug]) {
    return SLUG_ICON_MAP[categorySlug]!;
  }
  return "wrench";
}

export function formatNairaFromKobo(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Math.round((kobo || 0) / 100));
}

export function formatServicePriceRange(
  minKobo?: number | null,
  maxKobo?: number | null
): string {
  const min = Number(minKobo || 0);
  const max = maxKobo != null ? Number(maxKobo) : null;
  if (min <= 0 && (!max || max <= 0)) {
    return "Price available on request";
  }
  if (max && max > min) {
    return `${formatNairaFromKobo(min)} – ${formatNairaFromKobo(max)}`;
  }
  return `From ${formatNairaFromKobo(min)}`;
}

export function formatDurationLabel(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
  return `${hrs}h ${mins}m`;
}

export function getSimpleBookingStatus(status: string): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case "open":
    case "matched":
    case "submitted":
      return {
        label: "Waiting for quotes",
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      };
    case "quoted":
      return {
        label: "Waiting for quotes",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
      };
    case "accepted":
      return {
        label: "Awaiting payment",
        badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
      };
    case "scheduled":
    case "confirmed":
    case "in_progress":
    case "pro_marked_complete":
      return {
        label: "In progress",
        badgeClass: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
      };
    case "completed":
      return {
        label: "Done",
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      };
    case "disputed":
      return {
        label: "Under review",
        badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
      };
  }
}
