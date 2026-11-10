import React from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "./icons";

type SectionTone = "white" | "grey" | "navy";

const SECTION_TONES: Record<SectionTone, string> = {
  white: "bg-white text-[#1F2F34]",
  grey: "bg-[#F3F8F8] text-[#1F2F34]",
  navy: "bg-[#154752] text-white",
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
            isDark ? "text-[#EE9277]" : "text-[#24989A]"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={`mt-2.5 text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight leading-[1.15] ${
          isDark ? "text-white" : "text-[#154752]"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base sm:text-lg lg:text-[1.15rem] leading-relaxed ${
            isDark ? "text-[#DAE7E7]" : "text-[#68797C]"
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
    <section className="bg-[#154752] text-white border-b border-[#24989A]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-3xl">
          {tag && (
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.14em] text-[#EE9277]">
              {tag}
            </p>
          )}
          <h1 className="mt-3 text-3xl sm:text-5xl lg:text-[3.3rem] font-bold tracking-tight leading-[1.12]">
            {title}
          </h1>
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#DAE7E7] leading-relaxed">
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
          ? "bg-[#0D282E] border-[#24989A]/30"
          : "bg-white border-[#DAE7E7] shadow-xs hover:border-[#24989A]/40"
      }`}
    >
      <div
        className={`h-13 w-13 rounded-xl flex items-center justify-center ${
          isDark
            ? "bg-[#24989A]/20 text-[#24989A]"
            : "bg-[#F3F8F8] text-[#154752]"
        }`}
      >
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h3
        className={`mt-5 text-lg sm:text-xl font-bold leading-snug ${
          isDark ? "text-white" : "text-[#154752]"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-2.5 text-base leading-relaxed ${
          isDark ? "text-[#DAE7E7]" : "text-[#68797C]"
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
              ? "bg-[#0D282E] border-[#24989A]/30"
              : "bg-white border-[#DAE7E7] shadow-xs"
          }`}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#24989A] text-white text-base font-bold shadow-xs"
          >
            {index + 1}
          </span>
          <h3
            className={`mt-4 text-lg sm:text-xl font-bold leading-snug ${
              isDark ? "text-white" : "text-[#154752]"
            }`}
          >
            <span className="sr-only">Step {index + 1}: </span>
            {step.title}
          </h3>
          <p
            className={`mt-2.5 text-base leading-relaxed ${
              isDark ? "text-[#DAE7E7]" : "text-[#68797C]"
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
          <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-[#24989A] text-white flex items-center justify-center">
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          <span
            className={`text-base leading-relaxed ${
              tone === "dark" ? "text-[#DAE7E7]" : "text-[#1F2F34]"
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
    <div className="divide-y divide-[#DAE7E7] rounded-2xl border border-[#DAE7E7] bg-white">
      {items.map((item) => (
        <details key={item.question} className="group p-6 sm:p-7">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base sm:text-lg font-bold text-[#154752] [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="mt-0.5 h-7 w-7 shrink-0 rounded-full border border-[#DAE7E7] flex items-center justify-center text-[#24989A] text-lg transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3.5 text-base leading-relaxed text-[#68797C]">{item.answer}</p>
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
    <section aria-labelledby={id} className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#154752] px-7 py-12 sm:px-14 sm:py-16 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 shadow-md">
          <div className="max-w-2xl">
            <h2 id={id} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              {title}
            </h2>
            <p className="mt-3.5 text-[#DAE7E7] text-base sm:text-lg lg:text-xl leading-relaxed">{description}</p>
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
      className="font-semibold text-[#24989A] underline decoration-[#24989A]/40 underline-offset-4 hover:text-[#1D7E80] hover:decoration-[#24989A]"
    >
      {children}
    </Link>
  );
}
