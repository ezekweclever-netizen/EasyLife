import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getServiceCategories,
  getProfessionalById,
  getCustomerProfile,
} from "@/lib/supabase/customer";
import { CustomerHeader } from "@/components/customer/customer-header";
import { BookingWizard } from "@/components/booking/booking-wizard";

export const metadata: Metadata = {
  title: "Request a Service — EasyLife",
  description:
    "Submit a service request for accredited plumbing, electrical, generator, AC, and facility repairs across Port Harcourt, Lagos, and Abuja.",
};

interface BookPageProps {
  searchParams: Promise<{
    category?: string;
    pro?: string;
    city?: string;
    title?: string;
    description?: string;
    urgency?: "normal" | "high" | "emergency";
  }>;
}

export default async function BookServicePage({ searchParams }: BookPageProps) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/book");
  }

  const {
    category,
    pro,
    city,
    title,
    description,
    urgency,
  } = await searchParams;

  const [categories, preSelectedPro, profile] = await Promise.all([
    getServiceCategories(),
    pro ? getProfessionalById(pro) : Promise.resolve(null),
    getCustomerProfile(auth.user.id, auth.accessToken),
  ]);

  const activeCity = city?.trim() || profile?.city || "Port Harcourt";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
        }}
        selectedCity={activeCity}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
            <span>✓ Verified Technician Guarantee</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            Request Service in {activeCity}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Describe your repair or maintenance need. Nearby accredited trade specialists will review your fault and submit transparent quotations.
          </p>
        </div>

        <BookingWizard
          categories={categories}
          preSelectedCategory={category}
          preSelectedPro={preSelectedPro}
          defaultCity={activeCity}
          initialTitle={title}
          initialDescription={description}
          initialUrgency={urgency}
          userEmail={auth.user.email || undefined}
          userName={profile?.full_name}
        />
      </main>
    </div>
  );
}
