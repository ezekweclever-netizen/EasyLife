import React from "react";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "navy" | "teal-tinted" | "muted";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

const VARIANT_STYLES: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-white border-[#DAE7E7] text-[#1F2F34]",
  navy: "bg-[#154752] border-[#24989A]/30 text-white",
  "teal-tinted": "bg-[#F3F8F8] border-[#24989A]/30 text-[#1F2F34]",
  muted: "bg-[#F3F8F8] border-[#DAE7E7] text-[#1F2F34]",
};

const PADDING_STYLES: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border shadow-xs transition-shadow ${VARIANT_STYLES[variant]} ${PADDING_STYLES[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-4 border-b border-[#DAE7E7] ${className}`}
    >
      <div>
        <h3 className="text-base font-semibold text-inherit">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#68797C] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  accent = "teal",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  accent?: "teal" | "navy" | "warning" | "error";
}) {
  const borderAccent = {
    teal: "border-l-4 border-l-[#0D9488]",
    navy: "border-l-4 border-l-[#0A192F]",
    warning: "border-l-4 border-l-[#B45309]",
    error: "border-l-4 border-l-[#B91C1C]",
  }[accent];

  return (
    <Card padding="md" className={borderAccent}>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#0F172A] tracking-tight">
        {value}
      </p>
      {subtext && <p className="mt-1 text-xs text-[#4B5563]">{subtext}</p>}
    </Card>
  );
}
