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
    return "Custom Quote";
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
