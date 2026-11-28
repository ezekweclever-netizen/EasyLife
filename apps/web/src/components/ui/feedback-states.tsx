import React from "react";
import { Button } from "./button";

export type AlertTone = "info" | "success" | "warning" | "error";

const ALERT_STYLES: Record<
  AlertTone,
  { container: string; title: string; badge: string }
> = {
  info: {
    container: "bg-[#EBF0F5] border-[#C3C8CF] text-[#4A525C]",
    title: "text-[#1F2328]",
    badge: "bg-[#4A525C] text-white",
  },
  success: {
    container: "bg-[#E8F5ED] border-[#A3D9B5] text-[#2E7D4F]",
    title: "text-[#2E7D4F]",
    badge: "bg-[#2E7D4F] text-white",
  },
  warning: {
    container: "bg-[#FEF7EC] border-[#F5D499] text-[#B7791F]",
    title: "text-[#B7791F]",
    badge: "bg-[#B7791F] text-white",
  },
  error: {
    container: "bg-[#FDE8E8] border-[#F8B4B4] text-[#C53030]",
    title: "text-[#C53030]",
    badge: "bg-[#C53030] text-white",
  },
};

export interface AlertBannerProps {
  tone?: AlertTone;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AlertBanner({
  tone = "info",
  title,
  description,
  action,
  className = "",
}: AlertBannerProps) {
  const style = ALERT_STYLES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${style.container} ${className}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.badge}`}
          >
            {tone}
          </span>
          <h4 className={`text-sm font-semibold ${style.title}`}>{title}</h4>
        </div>
        {description && <p className="mt-1 text-xs opacity-90">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] p-8 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div
        className="h-12 w-12 rounded-full bg-[#FCEBDD] border border-[#E8590C]/30 flex items-center justify-center text-[#E8590C] font-bold text-lg mb-3"
        aria-hidden="true"
      >
        E
      </div>
      <h3 className="text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3]">{title}</h3>
      <p className="mt-1 text-sm text-[#4A525C] dark:text-[#C3C8CF] max-w-md">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function LoadingState({
  label = "Loading...",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328] p-8 flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        className="h-7 w-7 rounded-full border-3 border-[#E8590C] border-t-transparent animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-[#1F2328] dark:text-[#FAF7F3]">{label}</p>
    </div>
  );
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-[#E6E0D8] dark:bg-[#2E343B] ${className}`}
    />
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  requestId?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to complete operation",
  message,
  requestId,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-[#F8B4B4] bg-[#FDE8E8] dark:bg-[#C53030]/10 p-6 text-[#C53030] ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#C53030]">{title}</h3>
          <p className="mt-1 text-sm text-[#9B2626] dark:text-[#F8B4B4]">{message}</p>
          {requestId && (
            <p className="mt-2 text-xs font-mono text-[#C53030]/80">
              Reference ID: {requestId}
            </p>
          )}
        </div>
        {onRetry && (
          <Button variant="danger" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
