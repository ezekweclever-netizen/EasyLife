"use client";

import React, { useActionState } from "react";
import { contactAction } from "@/app/actions/auth";
import {
  CONTACT_INQUIRY_TYPES,
  CONTACT_INQUIRY_LABELS,
  PILOT_CITIES,
  type FormActionState,
  type ContactField,
} from "@/lib/validation/forms";
import { Button } from "@/components/ui/button";

const initialState: FormActionState<ContactField> = {
  status: "idle",
  values: {},
  fieldErrors: {},
};

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, formAction, isPending] = useActionState(contactAction, initialState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-300 flex items-start gap-3"
        >
          <span className="font-bold text-red-600 mt-0.5">!</span>
          <span>{state.message}</span>
        </div>
      )}

      {state.status === "success" && state.message && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-900 flex items-start gap-3"
        >
          <span className="font-bold text-emerald-600 mt-0.5">✓</span>
          <div>
            <p className="font-semibold">Inquiry Received</p>
            <p className="mt-1 text-emerald-800 dark:text-emerald-300">{state.message}</p>
          </div>
        </div>
      )}

      {/* Name and Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
          >
            Your Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            defaultValue={state.values?.fullName ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.fullName)}
            className={`w-full h-12 px-3.5 rounded-lg border text-base text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] ${
              state.fieldErrors?.fullName
                ? "border-red-500 bg-red-50 dark:bg-red-950/60/20"
                : "border-[#E6E0D8] dark:border-[#2E343B] hover:border-slate-400"
            }`}
            placeholder="e.g. Amaka Danladi"
          />
          {state.fieldErrors?.fullName && (
            <p className="mt-1.5 text-sm text-red-600 font-medium">
              {state.fieldErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className={`w-full h-12 px-3.5 rounded-lg border text-base text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] ${
              state.fieldErrors?.email
                ? "border-red-500 bg-red-50 dark:bg-red-950/60/20"
                : "border-[#E6E0D8] dark:border-[#2E343B] hover:border-slate-400"
            }`}
            placeholder="e.g. amaka@example.com"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1.5 text-sm text-red-600 font-medium">
              {state.fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      {/* Phone and Topic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="phone"
            className="block text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
          >
            Phone Number (Optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={state.values?.phone ?? ""}
            className="w-full h-12 px-3.5 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] text-base text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] hover:border-slate-400"
            placeholder="e.g. 0802 000 0000"
          />
          {state.fieldErrors?.phone && (
            <p className="mt-1.5 text-sm text-red-600 font-medium">
              {state.fieldErrors.phone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="inquiryType"
            className="block text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
          >
            Topic / Category
          </label>
          <select
            id="inquiryType"
            name="inquiryType"
            defaultValue={
              defaultTopic && CONTACT_INQUIRY_TYPES.includes(defaultTopic as any)
                ? defaultTopic
                : (state.values?.inquiryType ?? "customer_support")
            }
            required
            aria-invalid={Boolean(state.fieldErrors?.inquiryType)}
            className="w-full h-12 px-3.5 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] text-base text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] hover:border-slate-400"
          >
            {CONTACT_INQUIRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {CONTACT_INQUIRY_LABELS[type]}
              </option>
            ))}
          </select>
          {state.fieldErrors?.inquiryType && (
            <p className="mt-1.5 text-sm text-red-600 font-medium">
              {state.fieldErrors.inquiryType}
            </p>
          )}
        </div>
      </div>

      {/* City and Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="city"
            className="block text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
          >
            Your Location / City (Optional)
          </label>
          <select
            id="city"
            name="city"
            defaultValue={state.values?.city ?? ""}
            className="w-full h-12 px-3.5 rounded-lg border border-[#E6E0D8] dark:border-[#2E343B] text-base text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] hover:border-slate-400"
          >
            <option value="">Select a city (or nationwide)</option>
            {PILOT_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
          >
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            defaultValue={state.values?.subject ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.subject)}
            className={`w-full h-12 px-3.5 rounded-lg border text-base text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] ${
              state.fieldErrors?.subject
                ? "border-red-500 bg-red-50 dark:bg-red-950/60/20"
                : "border-[#E6E0D8] dark:border-[#2E343B] hover:border-slate-400"
            }`}
            placeholder="Brief description of your query"
          />
          {state.fieldErrors?.subject && (
            <p className="mt-1.5 text-sm text-red-600 font-medium">
              {state.fieldErrors.subject}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-base font-semibold text-[#1F2328] dark:text-[#FAF7F3] mb-1.5"
        >
          Message Details
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={state.values?.message ?? ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.message)}
          className={`w-full p-3.5 rounded-lg border text-base text-[#1F2328] dark:text-[#FAF7F3] bg-white dark:bg-[#1F2328] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E8590C] ${
            state.fieldErrors?.message
              ? "border-red-500 bg-red-50 dark:bg-red-950/60/20"
              : "border-[#E6E0D8] dark:border-[#2E343B] hover:border-slate-400"
          }`}
          placeholder="Please explain how we can assist you..."
        />
        {state.fieldErrors?.message && (
          <p className="mt-1.5 text-sm text-red-600 font-medium">
            {state.fieldErrors.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto px-8 h-12 text-base font-semibold"
      >
        {isPending ? "Sending message..." : "Send Inquiry"}
      </Button>
    </form>
  );
}
