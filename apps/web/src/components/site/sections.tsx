import React from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "./icons";

type SectionTone = "white" | "grey" | "navy" | "cream" | "peach";

const SECTION_TONES: Record<SectionTone, string> = {
  white: "bg-white dark:bg-[#15181C] text-[#1F2328] dark:text-[#FAF7F3]",
  grey: "bg-[#FAF7F3] dark:bg-[#15181C] text-[#1F2328] dark:text-[#FAF7F3]",
  cream: "bg-[#FAF7F3] dark:bg-[#15181C] text-[#1F2328] dark:text-[#FAF7F3]",
  peach: "bg-[#FCEBDD] dark:bg-[#1F2328] text-[#1F2328] dark:text-[#FAF7F3]",
  navy: "bg-[#1F2328] text-white",
};

export function Section({
  id,
  labelledBy,
  tone = "white",
  className = "",
  children,
}: {
  id?: string;
  labelledBy?: string;
  tone?: SectionTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${SECTION_TONES[tone]} py-16 sm:py-24 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p
          className={`text-xs sm:text-sm font-bold uppercase tracking-[0.14em] ${
            isDark ? "text-[#E8590C]" : "text-[#E8590C]"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={`mt-2.5 text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight leading-[1.15] ${
          isDark ? "text-white" : "text-[#1F2328] dark:text-white"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base sm:text-lg lg:text-[1.15rem] leading-relaxed ${
            isDark ? "text-[#C3C8CF]" : "text-[#4A525C] dark:text-[#C3C8CF]"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function PageHero({
  eyebrow,
  badge,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  badge?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  const tag = eyebrow || badge;
  return (
    <section className="bg-[#1F2328] text-white border-b border-[#2E343B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          {tag && (
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#E8590C]">
              {tag}
            </p>
          )}
          <h1 className="mt-3 text-3xl sm:text-5xl lg:text-[3.3rem] font-bold tracking-tight leading-[1.12]">
            {title}
          </h1>
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#C3C8CF] leading-relaxed">
            {description}
          </p>
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  tone = "light",
}: {
  icon: IconName;
  title: string;
  description: string;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      className={`rounded-2xl border p-7 sm:p-8 h-full transition-all ${
        isDark
          ? "bg-[#15181C] border-[#2E343B]"
          : "bg-white dark:bg-[#1F2328] border-[#E6E0D8] dark:border-[#2E343B] shadow-xs hover:border-[#E8590C]/40 dark:hover:border-[#E8590C]/60"
      }`}
    >
      <div
        className={`h-13 w-13 rounded-xl flex items-center justify-center ${
          isDark
            ? "bg-[#E8590C]/20 text-[#E8590C]"
            : "bg-[#FCEBDD] dark:bg-[#E8590C]/20 text-[#E8590C]"
        }`}
      >
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h3
        className={`mt-5 text-lg sm:text-xl font-bold leading-snug ${
          isDark ? "text-white" : "text-[#1F2328] dark:text-white"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-2.5 text-base leading-relaxed ${
          isDark ? "text-[#C3C8CF]" : "text-[#4A525C] dark:text-[#C3C8CF]"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

export interface Step {
  title: string;
  description: string;
}

export function StepList({
  steps,
  tone = "light",
}: {
  steps: readonly Step[];
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={`relative rounded-2xl border p-7 sm:p-8 ${
            isDark
              ? "bg-[#15181C] border-[#2E343B]"
              : "bg-white dark:bg-[#1F2328] border-[#E6E0D8] dark:border-[#2E343B] shadow-xs"
          }`}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8590C] text-white text-base font-bold shadow-xs"
          >
            {index + 1}
          </span>
          <h3
            className={`mt-4 text-lg sm:text-xl font-bold leading-snug ${
              isDark ? "text-white" : "text-[#1F2328] dark:text-white"
            }`}
          >
            <span className="sr-only">Step {index + 1}: </span>
            {step.title}
          </h3>
          <p
            className={`mt-2.5 text-base leading-relaxed ${
              isDark ? "text-[#C3C8CF]" : "text-[#4A525C] dark:text-[#C3C8CF]"
            }`}
          >
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function CheckList({
  items,
  tone = "light",
}: {
  items: readonly string[];
  tone?: "light" | "dark";
}) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3.5">
          <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#2E7D4F] text-white flex items-center justify-center">
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          <span
            className={`text-base leading-relaxed ${
              tone === "dark" ? "text-[#C3C8CF]" : "text-[#1F2328] dark:text-[#FAF7F3]"
            }`}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Native <details>/<summary> accordion — keyboard and screen-reader accessible without JS. */
export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="divide-y divide-[#E6E0D8] dark:divide-[#2E343B] rounded-2xl border border-[#E6E0D8] dark:border-[#2E343B] bg-white dark:bg-[#1F2328]">
      {items.map((item) => (
        <details key={item.question} className="group p-6 sm:p-7">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base sm:text-lg font-bold text-[#1F2328] dark:text-[#FAF7F3] [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="mt-0.5 h-7 w-7 shrink-0 rounded-full border border-[#E6E0D8] dark:border-[#2E343B] flex items-center justify-center text-[#E8590C] text-lg transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3.5 text-base leading-relaxed text-[#4A525C] dark:text-[#C3C8CF]">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBanner({
  id,
  title,
  description,
  primary,
  secondary,
}: {
  id: string;
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section aria-labelledby={id} className="bg-white dark:bg-[#15181C] py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#1F2328] dark:bg-[#15181C] border border-[#2E343B] px-7 py-12 sm:px-14 sm:py-16 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 shadow-md">
          <div className="max-w-2xl">
            <h2 id={id} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              {title}
            </h2>
            <p className="mt-3.5 text-[#C3C8CF] text-base sm:text-lg lg:text-xl leading-relaxed">{description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3.5 shrink-0">
            <ButtonLink href={primary.href} size="lg">
              {primary.label}
            </ButtonLink>
            {secondary && (
              <ButtonLink href={secondary.href} size="lg" variant="outline-inverse">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-[#E8590C] underline decoration-[#E8590C]/40 underline-offset-4 hover:text-[#C84A06] hover:decoration-[#E8590C]"
    >
      {children}
    </Link>
  );
}
