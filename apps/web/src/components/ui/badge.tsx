import React from "react";
import type {
  AssetStatus,
  BookingStatus,
  QuotationStatus,
  UrgencyLevel,
  VerificationStatus,
} from "@easylife/shared-types";

export type BadgeTone =
  | "teal"
  | "orange"
  | "navy"
  | "charcoal"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  teal: "bg-[#FCEBDD] dark:bg-[#1F2328] text-[#E8590C] dark:text-[#F06A1F] border-[#E8590C]/30 dark:border-[#F06A1F]/30",
  orange: "bg-[#FCEBDD] dark:bg-[#1F2328] text-[#E8590C] dark:text-[#F06A1F] border-[#E8590C]/30 dark:border-[#F06A1F]/30",
  navy: "bg-[#1F2328] text-[#FAF7F3] border-[#2E343B]",
  charcoal: "bg-[#1F2328] text-[#FAF7F3] border-[#2E343B]",
  success: "bg-[#E8F5ED] dark:bg-[#1A3626] text-[#2E7D4F] dark:text-[#48BB78] border-[#A3D9B5] dark:border-[#2E7D4F]/40",
  warning: "bg-[#FEF7EC] dark:bg-[#382815] text-[#B7791F] dark:text-[#ED8936] border-[#F5D499] dark:border-[#B7791F]/40",
  error: "bg-[#FDE8E8] dark:bg-[#381A1A] text-[#C53030] dark:text-[#F56565] border-[#F8B4B4] dark:border-[#C53030]/40",
  info: "bg-[#EBF0F5] dark:bg-[#262D36] text-[#4A525C] dark:text-[#C3C8CF] border-[#C3C8CF] dark:border-[#2E343B]",
  neutral: "bg-[#FAF7F3] dark:bg-[#1F2328] text-[#4A525C] dark:text-[#C3C8CF] border-[#E6E0D8] dark:border-[#2E343B]",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({
  tone = "neutral",
  dot = false,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  pending_pro_response: { label: "Pending Response", tone: "info" },
  open: { label: "Open Request", tone: "info" },
  quoted: { label: "Quotations Received", tone: "teal" },
  accepted: { label: "Quote Accepted", tone: "teal" },
  confirmed: { label: "Confirmed Appointment", tone: "teal" },
  scheduled: { label: "Scheduled", tone: "teal" },
  in_progress: { label: "In Progress", tone: "warning" },
  pro_marked_complete: { label: "Awaiting Confirmation", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  disputed: { label: "Disputed", tone: "error" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = BOOKING_STATUS_CONFIG[status] ?? {
    label: status,
    tone: "neutral" as const,
  };
  return (
    <Badge tone={cfg.tone} dot>
      {cfg.label}
    </Badge>
  );
}

const VERIFICATION_STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; tone: BadgeTone }
> = {
  unsubmitted: { label: "Unsubmitted", tone: "neutral" },
  pending: { label: "Pending Review", tone: "warning" },
  approved: { label: "Verified Professional", tone: "teal" },
  rejected: { label: "Verification Rejected", tone: "error" },
  suspended: { label: "Suspended", tone: "error" },
};

export function VerificationStatusBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  const cfg = VERIFICATION_STATUS_CONFIG[status];
  return (
    <Badge tone={cfg.tone} dot>
      {cfg.label}
    </Badge>
  );
}

const QUOTATION_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; tone: BadgeTone }
> = {
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending Decision", tone: "warning" },
  accepted: { label: "Accepted", tone: "success" },
  declined: { label: "Declined", tone: "neutral" },
  withdrawn: { label: "Withdrawn", tone: "neutral" },
  expired: { label: "Expired", tone: "error" },
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const cfg = QUOTATION_STATUS_CONFIG[status];
  return (
    <Badge tone={cfg.tone} dot>
      {cfg.label}
    </Badge>
  );
}

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; tone: BadgeTone }> =
  {
    low: { label: "Low Urgency", tone: "neutral" },
    normal: { label: "Normal", tone: "info" },
    high: { label: "High Priority", tone: "warning" },
    emergency: { label: "Emergency", tone: "error" },
  };

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  const cfg = URGENCY_CONFIG[urgency];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

const ASSET_STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; tone: BadgeTone }
> = {
  operational: { label: "Operational", tone: "success" },
  needs_maintenance: { label: "Maintenance Due", tone: "warning" },
  under_repair: { label: "Under Repair", tone: "info" },
  decommissioned: { label: "Decommissioned", tone: "neutral" },
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const cfg = ASSET_STATUS_CONFIG[status];
  return (
    <Badge tone={cfg.tone} dot>
      {cfg.label}
    </Badge>
  );
}
