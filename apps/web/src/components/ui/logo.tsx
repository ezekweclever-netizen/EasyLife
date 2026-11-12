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
    width: 150,
    height: 42,
    imgClass: "h-9 sm:h-10.5 w-auto",
  },
  md: {
    width: 178,
    height: 50,
    imgClass: "h-11 sm:h-12.5 w-auto",
  },
  lg: {
    width: 214,
    height: 60,
    imgClass: "h-13 sm:h-15 w-auto",
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
  const src = isDark
    ? "/brand/easylife-official-logo-dark.png"
    : "/brand/easylife-official-logo.png";

  return (
    <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <Image
        src={src}
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
