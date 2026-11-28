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
    "bg-[#E8590C] dark:bg-[#F06A1F] text-white hover:bg-[#C84A06] dark:hover:bg-[#E8590C] active:bg-[#B33E05] border border-transparent shadow-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#E8590C] dark:focus-visible:outline-[#F06A1F]",
  navy:
    "bg-[#1F2328] text-white hover:bg-[#2B3138] active:bg-[#15181C] border border-transparent shadow-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#1F2328] dark:focus-visible:outline-[#F06A1F]",
  secondary:
    "bg-[#FAF7F3] dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#E6E0D8] dark:hover:bg-[#2E343B] border border-[#E6E0D8] dark:border-[#2E343B] font-semibold focus-visible:outline-2 focus-visible:outline-[#E8590C] dark:focus-visible:outline-[#F06A1F]",
  outline:
    "bg-white dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#2E343B] border border-[#E6E0D8] dark:border-[#2E343B] font-semibold focus-visible:outline-2 focus-visible:outline-[#E8590C] dark:focus-visible:outline-[#F06A1F]",
  ghost:
    "bg-transparent text-[#1F2328] dark:text-[#FAF7F3] hover:bg-[#FAF7F3] dark:hover:bg-[#1F2328] border border-transparent font-medium focus-visible:outline-2 focus-visible:outline-[#E8590C] dark:focus-visible:outline-[#F06A1F]",
  danger:
    "bg-[#C53030] text-white hover:bg-[#9B2626] border border-transparent shadow-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#C53030]",
  inverse:
    "bg-white text-[#1F2328] hover:bg-[#FAF7F3] border border-transparent shadow-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#1F2328]",
  "outline-inverse":
    "bg-transparent text-white hover:bg-white/10 border border-white/40 font-semibold focus-visible:outline-2 focus-visible:outline-white",
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
