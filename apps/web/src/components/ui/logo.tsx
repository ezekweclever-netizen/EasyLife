import React from "react";
import { EASYLIFE_BRAND } from "@easylife/shared-config";

export interface EasyLifeLogoProps {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  markOnly?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: {
    box: 34,
    title: "text-lg",
    slogan: "text-[9.5px] sm:text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    box: 42,
    title: "text-xl sm:text-2xl",
    slogan: "text-[10.5px] sm:text-[11.5px]",
    gap: "gap-3",
  },
  lg: {
    box: 52,
    title: "text-2xl sm:text-3xl",
    slogan: "text-xs sm:text-[13px]",
    gap: "gap-3.5",
  },
} as const;

export function EasyLifeLogo({
  theme = "light",
  size = "md",
  showSlogan = true, // Default to true so primary lockup always features the slogan directly beneath
  markOnly = false,
  className = "",
}: EasyLifeLogoProps) {
  const dimensions = SIZE_MAP[size];
  const isDark = theme === "dark";

  return (
    <div className={`inline-flex items-center ${dimensions.gap} select-none ${className}`}>
      {/* Refreshed Original EasyLife Monogram Symbol */}
      <svg
        width={dimensions.box}
        height={dimensions.box}
        viewBox="0 0 64 64"
        fill="none"
        role="img"
        aria-label={`${EASYLIFE_BRAND.name} logo mark`}
        className="shrink-0"
      >
        <defs>
          <linearGradient id="el-emblem-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isDark ? "#24989A" : "#154752"} />
            <stop offset="100%" stopColor={isDark ? "#154752" : "#0D282E"} />
          </linearGradient>
        </defs>
        {/* Rounded Modern Emblem */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill="url(#el-emblem-grad)"
        />
        {/* Inner subtle structural border */}
        <rect
          x="3.5"
          y="3.5"
          width="57"
          height="57"
          rx="15.5"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />
        {/* Dynamic Architectural E-L Ease Path */}
        <path
          d="M17 21H38M17 32H33M17 43H45"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M17 21V43"
          stroke="#FFFFFF"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Upward Solution Curve to Apex */}
        <path
          d="M31 38L38 43L49 25"
          stroke="#24989A"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Warm Coral Solution Spark */}
        <circle cx="49" cy="25" r="3.5" fill="#EE9277" />
      </svg>

      {!markOnly && (
        <div className="flex flex-col justify-center leading-tight">
          {/* EasyLife Wordmark */}
          <span
            className={`font-bold tracking-tight ${dimensions.title} ${
              isDark ? "text-white" : "text-[#154752]"
            }`}
          >
            Easy
            <span className={isDark ? "text-[#24989A]" : "text-[#24989A]"}>
              Life
            </span>
          </span>
          {/* Slogan directly beneath the EasyLife name */}
          {showSlogan && (
            <span
              className={`mt-0.5 font-medium tracking-tight whitespace-nowrap ${
                dimensions.slogan
              } ${isDark ? "text-[#DAE7E7]" : "text-[#68797C]"}`}
            >
              Everyday Problems. Smarter Solutions.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
