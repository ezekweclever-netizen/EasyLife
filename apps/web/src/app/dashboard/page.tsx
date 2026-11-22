import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getCustomerProfile,
  getServiceCategories,
  getCustomerBookings,
  getDiscoverableProfessionals,
  getCustomerNotifications,
} from "@/lib/supabase/customer";
import { CustomerHeader } from "@/components/customer/customer-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";

export const metadata = {
  title: "Customer Dashboard — EasyLife",
  description: "Manage your home and facility service requests, explore verified professionals, and track bookings.",
};

const NIGERIAN_DISTRICTS: Record<string, string[]> = {
  "Port Harcourt": ["GRA Phase 2", "Peter Odili Road", "Trans-Amadi", "Woji", "Rumuola", "Old GRA", "Choba", "Ada George"],
  Lagos: ["Lekki Phase 1", "Victoria Island", "Ikoyi", "Ikeja GRA", "Maryland", "Surulere", "Yaba", "Ajah"],
  Abuja: ["Maitama", "Wuse 2", "Garki", "Jabi", "Gwarinpa", "Asokoro", "Guzape", "Apo"],
};

export default async function CustomerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; q?: string }>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/dashboard");
  }

  const resolvedParams = await searchParams;
  const requestedCity = resolvedParams.city?.trim() || "";

  // Concurrently fetch profile, top-level categories, bookings, notifications, and (when city param known) pros
  const [profile, categories, bookings, notifications, preloadedPros] = await Promise.all([
    getCustomerProfile(auth.user.id, auth.accessToken),
    getServiceCategories({ topLevelOnly: true }),
    getCustomerBookings(auth.user.id, auth.accessToken),
    getCustomerNotifications(auth.user.id, auth.accessToken),
    requestedCity
      ? getDiscoverableProfessionals({ city: requestedCity, limit: 6 })
      : Promise.resolve(null),
  ]);

  const currentCity = requestedCity || profile?.city || "Port Harcourt";
  const recommendedPros =
    preloadedPros ?? (await getDiscoverableProfessionals({ city: currentCity, limit: 6 }));

  const activeBookings = bookings.filter((b) =>
    ["open", "matched", "quoted", "accepted", "scheduled", "in_progress"].includes(b.status)
  );
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const customerName = profile?.display_name || profile?.full_name || auth.user.email?.split("@")[0] || "Valued Customer";
  const districts = NIGERIAN_DISTRICTS[currentCity] || NIGERIAN_DISTRICTS["Port Harcourt"] || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#071526] pb-24 md:pb-12 text-[#0F172A] dark:text-slate-100">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
        }}
        unreadNotificationsCount={unreadNotifications.length}
        selectedCity={currentCity}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. WELCOME SECTION & QUICK STATS */}
        <section className="bg-gradient-to-r from-[#0F766E] to-[#115E59] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#0D223A]/10 backdrop-blur text-xs font-medium text-[#CCFBF1]">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
              EasyLife Pilot Services Active in {currentCity}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {customerName}! 👋
            </h1>
            <p className="text-[#CCFBF1] text-sm sm:text-base leading-relaxed">
              Book verified local technicians, track active repairs with transparent escrow, and manage all your properties from one place.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/book?city=${encodeURIComponent(currentCity)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white dark:bg-[#0D223A] text-[#0F766E] hover:bg-[#F0FDFA] transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Request a Service
              </Link>
              <Link
                href={`/explore-services?city=${encodeURIComponent(currentCity)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-white dark:bg-[#0D223A]/10 text-white hover:bg-white dark:bg-[#0D223A]/20 transition-colors"
              >
                Explore All Services
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            <div className="bg-white dark:bg-[#0D223A]/5 rounded-xl p-3">
              <span className="text-xs text-[#CCFBF1]">Active Requests</span>
              <p className="text-2xl font-extrabold text-white">{activeBookings.length}</p>
            </div>
            <div className="bg-white dark:bg-[#0D223A]/5 rounded-xl p-3">
              <span className="text-xs text-[#CCFBF1]">Completed Jobs</span>
              <p className="text-2xl font-extrabold text-white">{completedBookings.length}</p>
            </div>
            <div className="bg-white dark:bg-[#0D223A]/5 rounded-xl p-3">
              <span className="text-xs text-[#CCFBF1]">Service City</span>
              <p className="text-base font-bold text-white truncate">{currentCity}</p>
            </div>
            <div className="bg-white dark:bg-[#0D223A]/5 rounded-xl p-3">
              <span className="text-xs text-[#CCFBF1]">Payment Security</span>
              <p className="text-sm font-bold text-[#34D399] flex items-center gap-1">
                <span>🛡️ Escrow Protected</span>
              </p>
            </div>
          </div>
        </section>

        {/* 2. SEARCH BAR & LOCATION SELECTOR */}
        <section className="bg-white dark:bg-[#0D223A] rounded-2xl p-4 sm:p-6 shadow-sm border border-[#E2E8F0] dark:border-[#163654] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                Find a Professional in {currentCity}
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
                Enter any fault, appliance, or trade for verified matching
              </p>
            </div>

            {/* City Quick Switcher */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {["Port Harcourt", "Lagos", "Abuja"].map((c) => (
                <Link
                  key={c}
                  href={`/dashboard?city=${encodeURIComponent(c)}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    currentCity === c
                      ? "bg-[#0F766E] text-white"
                      : "bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-[#E2E8F0] dark:hover:bg-slate-700"
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Form */}
          <form action="/explore-services" method="GET" className="relative flex items-center">
            <input type="hidden" name="city" value={currentCity} />
            <div className="absolute left-4 text-[#94A3B8]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              name="q"
              defaultValue={resolvedParams.q || ""}
              placeholder="What do you need repaired? (e.g., AC not cooling, burst pipe, generator fault, inverter...)"
              className="w-full pl-11 pr-28 py-3.5 rounded-xl border border-[#CBD5E1] dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#0A1A2F] text-sm text-[#0F172A] dark:text-white placeholder-[#94A3B8] dark:placeholder-slate-500 focus:bg-white dark:focus:bg-[#0A1A2F] focus:outline-none focus:ring-2 focus:ring-[#0F766E] focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors"
            >
              Search
            </button>
          </form>

          {/* Local Area Distict Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs">
            <span className="text-[#64748B] dark:text-slate-400 font-medium shrink-0">Popular areas:</span>
            {districts.map((district) => (
              <Link
                key={district}
                href={`/explore-services?city=${encodeURIComponent(currentCity)}&area=${encodeURIComponent(district)}`}
                className="shrink-0 px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-300 hover:bg-[#CCFBF1] dark:hover:bg-teal-950/60 hover:text-[#0F766E] dark:hover:text-[#5CD3D5] transition-colors"
              >
                {district}
              </Link>
            ))}
          </div>
        </section>

        {/* 3. SERVICE CATEGORIES GRID (LIVE FROM SUPABASE) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Service Categories</h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">Accredited trade specializations in {currentCity}</p>
            </div>
            <Link
              href="/explore-services"
              className="text-xs sm:text-sm font-semibold text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
            >
              View all ({categories.length}) →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/book?category=${cat.id}`}
                className="group p-4 bg-white dark:bg-[#0D223A] rounded-xl border border-[#E2E8F0] dark:border-[#163654] hover:border-[#0F766E] dark:hover:border-teal-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-300 flex items-center justify-center font-bold text-lg group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                    {cat.slug.includes("plumb") ? "🔧" :
                     cat.slug.includes("elect") ? "⚡" :
                     cat.slug.includes("hvac") || cat.slug.includes("ac") ? "❄️" :
                     cat.slug.includes("gen") ? "⚙️" :
                     cat.slug.includes("carp") ? "🔨" :
                     cat.slug.includes("clean") ? "✨" :
                     cat.slug.includes("paint") ? "🎨" : "🔌"}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-white group-hover:text-[#0F766E] dark:group-hover:text-[#5CD3D5] transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-2">
                    {cat.description || "Verified residential and commercial repair services."}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-[#F1F5F9] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#0F766E] dark:text-[#5CD3D5]">
                  <span>Request Pro</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. ACTIVE SERVICE REQUESTS & RECENT BOOKINGS */}
        <section className="bg-white dark:bg-[#0D223A] rounded-2xl p-6 shadow-sm border border-[#E2E8F0] dark:border-[#163654] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">My Service Requests</h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">Real-time tracking for your repairs and jobs</p>
            </div>
            <Link
              href="/bookings"
              className="text-xs sm:text-sm font-semibold text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
            >
              See all bookings ({bookings.length}) →
            </Link>
          </div>

          {activeBookings.length > 0 ? (
            <div className="space-y-4">
              {activeBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl border border-[#E2E8F0] dark:border-[#163654] hover:border-[#CBD5E1] dark:hover:border-slate-700 bg-[#F8FAFC] dark:bg-[#0A1A2F] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0F766E] dark:text-[#5CD3D5] bg-[#F0FDFA] dark:bg-teal-950/60 px-2 py-0.5 rounded">
                        {b.reference_code}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {b.status.replace(/_/g, " ")}
                      </span>
                      {b.urgency === "emergency" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 dark:text-red-300 animate-pulse">
                          🚨 Emergency
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-[#0F172A] dark:text-white">{b.title}</h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 flex items-center gap-3">
                      <span>📍 {b.service_address}, {b.city}</span>
                      {b.preferred_date && (
                        <span>📅 Preferred: {b.preferred_date} ({b.preferred_time_slot || "Anytime"})</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#64748B] dark:text-slate-400 mx-auto flex items-center justify-center text-xl">
                📋
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">No active service requests</h3>
              <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
                Need an electrician, plumber, AC technician, or generator mechanic? Post a request and our operations team will match you with a verified pro.
              </p>
              <Link
                href="/book"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-sm"
              >
                Create Service Request
              </Link>
            </div>
          )}
        </section>

        {/* 5. RECOMMENDED PROFESSIONALS (FROM SUPABASE VIEW) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Recommended Professionals</h2>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">Accredited and vetted service providers in {currentCity}</p>
            </div>
            <Link
              href={`/explore-services?city=${encodeURIComponent(currentCity)}`}
              className="text-xs sm:text-sm font-semibold text-[#0F766E] dark:text-[#5CD3D5] hover:underline"
            >
              Search all →
            </Link>
          </div>

          {recommendedPros.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedPros.map((pro) => (
                <div
                  key={pro.professional_id}
                  className="bg-white dark:bg-[#0D223A] rounded-xl border border-[#E2E8F0] dark:border-[#163654] p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shrink-0">
                      {pro.display_name ? pro.display_name[0] : "P"}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-[#0F172A] dark:text-white truncate">
                          {pro.business_name || pro.display_name}
                        </h3>
                        {(pro.verification_status === "approved" || pro.verification_status === "verified") && (
                          <span className="text-[#0F766E] dark:text-[#5CD3D5]" title="Verified Professional">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-1">
                        {pro.headline || (pro.years_of_experience ? `${pro.years_of_experience}+ years of verified field service` : "Verified EasyLife Service Professional")}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                        <span className="font-semibold text-amber-500">
                          {Number(pro.review_count) > 0 && Number(pro.average_rating) > 0
                            ? `★ ${Number(pro.average_rating).toFixed(1)}`
                            : "No ratings yet"}
                        </span>
                        <span>({pro.review_count || 0} reviews)</span>
                        <span>•</span>
                        <span>{pro.completed_jobs_count || 0} jobs</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F1F5F9] dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#64748B] dark:text-slate-400 block">Callout Fee</span>
                      <span className="font-bold text-sm text-[#0F172A] dark:text-white">
                        {pro.base_callout_fee_kobo && pro.base_callout_fee_kobo > 0
                          ? `₦${(pro.base_callout_fee_kobo / 100).toLocaleString()}`
                          : "Price available on request"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/professionals/${pro.professional_id}`}
                        className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 font-semibold hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
                      >
                        Profile
                      </Link>
                      <Link
                        href={`/book?pro=${pro.professional_id}`}
                        className="px-3 py-1.5 rounded-lg bg-[#0F766E] text-white font-semibold hover:bg-[#0D655E]"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0D223A] rounded-xl border border-[#E2E8F0] dark:border-[#163654] p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                No registered professionals in {currentCity} yet.
              </p>
              <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-lg mx-auto">
                EasyLife guarantees direct assignment. When you post a service request, our city operations desk in {currentCity} dispatches an accredited technician directly to your address.
              </p>
              <div className="pt-2">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E]"
                >
                  <span>Post Service Request</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 6. SUPPORT ACCESS & GUARANTEE */}
        <section className="bg-white dark:bg-[#0D223A] rounded-2xl p-6 shadow-sm border border-[#E2E8F0] dark:border-[#163654] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] dark:text-[#5CD3D5] uppercase tracking-wider">
              <span>🛡️ The EasyLife Guarantee</span>
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Need Urgent Help or Have Questions?</h3>
            <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-xl">
              All bookings are covered by our verified technician guarantee, transparent dispute resolution, and secure escrow protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/2347049948582"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>WhatsApp Support</span>
            </a>
            <Link
              href="/help"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F1F5F9] dark:bg-slate-800 text-[#334155] dark:text-slate-200 hover:bg-[#E2E8F0] dark:hover:bg-slate-700 transition-colors"
            >
              Help Centre
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#CBD5E1] dark:border-slate-700 text-[#334155] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-colors"
            >
              Contact Operations
            </Link>
          </div>
        </section>
      </main>
      <WhatsAppFloatingButton />
    </div>
  );
}
