import Form from "next/form";
import { Icon } from "./icons";

/**
 * Main service search. Submits a GET request to /explore-services?q=...
 * (works without JavaScript; Next.js <Form> adds client-side navigation).
 */
export function ServiceSearchForm({
  id = "service-search",
  defaultQuery = "",
  tone = "dark",
}: {
  id?: string;
  defaultQuery?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Form
      action="/explore-services"
      role="search"
      aria-label="Search EasyLife services"
      className={`flex flex-col sm:flex-row gap-2.5 rounded-2xl p-2.5 ${
        tone === "dark"
          ? "bg-white shadow-xl shadow-black/15"
          : "bg-white border border-[#DAE7E7] shadow-xs"
      }`}
    >
      <label htmlFor={id} className="sr-only">
        What do you need help with?
      </label>
      <div className="relative flex-1">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#68797C]"
        />
        <input
          id={id}
          name="q"
          type="search"
          defaultValue={defaultQuery}
          maxLength={120}
          autoComplete="off"
          placeholder="e.g. generator not starting, AC leaking water"
          className="h-12 w-full rounded-xl bg-transparent pl-11 pr-3 text-base text-[#1F2F34] placeholder:text-[#68797C] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="h-12 px-7 rounded-xl bg-[#24989A] hover:bg-[#1D7E80] text-white text-base font-bold transition-all shadow-xs cursor-pointer"
      >
        Search services
      </button>
    </Form>
  );
}
