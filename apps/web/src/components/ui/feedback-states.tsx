import React from "react";
import { Button } from "./button";

export type AlertTone = "info" | "success" | "warning" | "error";

const ALERT_STYLES: Record<
  AlertTone,
  { container: string; title: string; badge: string }
> = {
  info: {
    container: "bg-[#EBF6F9] border-[#A9DCE7] text-[#1A6E84]",
    title: "text-[#1A6E84]",
    badge: "bg-[#1A6E84] text-white",
  },
  success: {
    container: "bg-[#E7F7F1] border-[#A3E5D0] text-[#127A5B]",
    title: "text-[#127A5B]",
    badge: "bg-[#127A5B] text-white",
  },
  warning: {
    container: "bg-[#FEF5E7] border-[#FCD9A5] text-[#B25E0A]",
    title: "text-[#B25E0A]",
    badge: "bg-[#B25E0A] text-white",
  },
  error: {
    container: "bg-[#FDF0F0] border-[#F8B4B4] text-[#C53030]",
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
      className={`rounded-2xl border border-dashed border-[#DAE7E7] bg-white p-8 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div
        className="h-12 w-12 rounded-full bg-[#F3F8F8] border border-[#24989A]/30 flex items-center justify-center text-[#24989A] font-bold text-lg mb-3"
        aria-hidden="true"
      >
        E
      </div>
      <h3 className="text-base font-semibold text-[#1F2F34]">{title}</h3>
      <p className="mt-1 text-sm text-[#68797C] max-w-md">{description}</p>
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
      className={`rounded-2xl border border-[#DAE7E7] bg-white p-8 flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        className="h-7 w-7 rounded-full border-3 border-[#24989A] border-t-transparent animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-[#1F2F34]">{label}</p>
    </div>
  );
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-[#DAE7E7] ${className}`}
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
      className={`rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 text-[#991B1B] ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#991B1B]">{title}</h3>
          <p className="mt-1 text-sm text-[#7F1D1D]">{message}</p>
          {requestId && (
            <p className="mt-2 text-xs font-mono text-[#991B1B]/80">
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
