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
  | "navy"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  teal: "bg-[#F3F8F8] text-[#154752] border-[#24989A]/40",
  navy: "bg-[#154752] text-white border-[#24989A]/30",
  success: "bg-[#E7F7F1] text-[#127A5B] border-[#A3E5D0]",
  warning: "bg-[#FEF5E7] text-[#B25E0A] border-[#FCD9A5]",
  error: "bg-[#FDF0F0] text-[#C53030] border-[#F8B4B4]",
  info: "bg-[#EBF6F9] text-[#1A6E84] border-[#A9DCE7]",
  neutral: "bg-[#F3F8F8] text-[#4E6065] border-[#DAE7E7]",
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
