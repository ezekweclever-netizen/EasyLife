import React from "react";
import Link from "next/link";

export type ButtonVariant =
  | "primary"
  | "navy"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "inverse"
  | "outline-inverse";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#24989A] text-white hover:bg-[#1D7E80] active:bg-[#154752] border border-transparent shadow-xs font-semibold",
  navy:
    "bg-[#154752] text-white hover:bg-[#0D282E] active:bg-[#081B1F] border border-transparent shadow-xs font-semibold",
  secondary:
    "bg-[#F3F8F8] dark:bg-slate-800 text-[#154752] dark:text-[#5CD3D5] hover:bg-[#DAE7E7] dark:hover:bg-slate-700 border border-[#DAE7E7] dark:border-slate-700 font-semibold",
  outline:
    "bg-white dark:bg-slate-800 text-[#1F2F34] dark:text-white hover:bg-[#F3F8F8] dark:hover:bg-slate-700 border border-[#DAE7E7] dark:border-slate-700 font-semibold",
  ghost:
    "bg-transparent text-[#1F2F34] dark:text-slate-200 hover:bg-[#F3F8F8] dark:hover:bg-slate-800 border border-transparent font-medium",
  danger:
    "bg-[#C53030] text-white hover:bg-[#991B1B] border border-transparent shadow-xs font-semibold",
  inverse:
    "bg-white text-[#154752] hover:bg-[#F3F8F8] border border-transparent shadow-xs font-semibold",
  "outline-inverse":
    "bg-transparent text-white hover:bg-white/10 border border-white/40 font-semibold",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm rounded-lg gap-1.5",
  md: "h-12 px-5.5 text-base rounded-xl gap-2",
  lg: "h-13 px-7 text-base sm:text-[1.0625rem] rounded-xl gap-2.5",
};

export function getButtonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  return `inline-flex items-center justify-center whitespace-nowrap shrink-0 font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${
    VARIANT_CLASSES[variant]
  } ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`.trim();
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={getButtonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {isLoading ? (
        <>
          <span
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
            aria-hidden="true"
          />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

export interface ButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Navigation link styled as a button. Uses Next.js <Link> so routes are
 * prefetched and navigated client-side.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </Link>
  );
}
