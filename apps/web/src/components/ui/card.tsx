import React from "react";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "navy" | "teal-tinted" | "muted";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

const VARIANT_STYLES: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-white dark:bg-[#1F2328] border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3]",
  navy: "bg-[#1F2328] dark:bg-[#15181C] border-[#2E343B] text-[#FAF7F3]",
  "teal-tinted": "bg-[#FAF7F3] dark:bg-[#1F2328] border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3]",
  muted: "bg-[#FAF7F3] dark:bg-[#1F2328] border-[#E6E0D8] dark:border-[#2E343B] text-[#1F2328] dark:text-[#FAF7F3]",
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
      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-4 border-b border-[#E6E0D8] dark:border-[#2E343B] ${className}`}
    >
      <div>
        <h3 className="text-base font-semibold text-inherit">{title}</h3>
        {subtitle && (
          <p className="text-xs text-[#4A525C] dark:text-[#C3C8CF] mt-0.5">{subtitle}</p>
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
    teal: "border-l-4 border-l-[#E8590C]",
    navy: "border-l-4 border-l-[#1F2328] dark:border-l-[#E8590C]",
    warning: "border-l-4 border-l-[#B7791F]",
    error: "border-l-4 border-l-[#C53030]",
  }[accent];

  return (
    <Card padding="md" className={borderAccent}>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#4A525C] dark:text-[#C3C8CF]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-[#1F2328] dark:text-[#FAF7F3] tracking-tight">
        {value}
      </p>
      {subtext && <p className="mt-1 text-xs text-[#4A525C] dark:text-[#C3C8CF]">{subtext}</p>}
    </Card>
  );
}
