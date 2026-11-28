import React from "react";
import Image from "next/image";
import { EASYLIFE_BRAND } from "@easylife/shared-config";

export interface EasyLifeLogoProps {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  markOnly?: boolean;
  priority?: boolean;
  className?: string;
}

const LOCKUP_DIMENSIONS = {
  sm: {
    width: 156,
    height: 76,
    imgClass: "h-[58px] sm:h-[72px] w-auto",
  },
  md: {
    width: 186,
    height: 90,
    imgClass: "h-[72px] sm:h-[88px] w-auto",
  },
  lg: {
    width: 228,
    height: 110,
    imgClass: "h-[88px] sm:h-[108px] w-auto",
  },
} as const;

const MARK_DIMENSIONS = {
  sm: {
    px: 36,
    imgClass: "h-9 w-9",
  },
  md: {
    px: 44,
    imgClass: "h-11 w-11",
  },
  lg: {
    px: 52,
    imgClass: "h-13 w-13",
  },
} as const;

export function EasyLifeLogo({
  theme = "light",
  size = "md",
  markOnly = false,
  priority = true,
  className = "",
}: EasyLifeLogoProps) {
  const isDark = theme === "dark";

  if (markOnly) {
    const dim = MARK_DIMENSIONS[size];
    return (
      <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <Image
          src="/brand/easylife-official-mark.png"
          alt={`${EASYLIFE_BRAND.name} emblem`}
          width={dim.px}
          height={dim.px}
          sizes={`${dim.px}px`}
          priority={priority}
          quality={90}
          className={`${dim.imgClass} object-contain shrink-0`}
        />
      </span>
    );
  }

  const dim = LOCKUP_DIMENSIONS[size];

  // If theme is explicitly passed as "dark", render dark logo only
  if (theme === "dark") {
    return (
      <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
        <Image
          src="/brand/easylife-logo-dark-mode.png"
          alt={`${EASYLIFE_BRAND.name} — ${EASYLIFE_BRAND.slogan}`}
          width={dim.width}
          height={dim.height}
          sizes={`${dim.width}px`}
          priority={priority}
          quality={90}
          className={`${dim.imgClass} object-contain shrink-0`}
        />
      </span>
    );
  }

  // By default, render both light and dark logos and toggle via CSS dark variant
  return (
    <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <Image
        src="/brand/easylife-logo-charcoal-orange.png"
        alt={`${EASYLIFE_BRAND.name} — ${EASYLIFE_BRAND.slogan}`}
        width={dim.width}
        height={dim.height}
        sizes={`${dim.width}px`}
        priority={priority}
        quality={90}
        className={`${dim.imgClass} object-contain shrink-0 dark:hidden`}
      />
      <Image
        src="/brand/easylife-logo-dark-mode.png"
        alt={`${EASYLIFE_BRAND.name} — ${EASYLIFE_BRAND.slogan}`}
        width={dim.width}
        height={dim.height}
        sizes={`${dim.width}px`}
        priority={priority}
        quality={90}
        className={`${dim.imgClass} object-contain shrink-0 hidden dark:inline-block`}
      />
    </span>
  );
}
