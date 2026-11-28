import React from "react";
import type { Metadata } from "next";
import { getActiveBusiness, fetchBusinessProperties } from "@/app/actions/business";
import { BusinessNav } from "@/components/business/business-nav";
import { PropertyManagerClient } from "@/components/business/property-manager-client";
import { RegisterBusinessClient } from "@/components/business/register-business-client";

export const metadata: Metadata = {
  title: "Property & Facility Management — EasyLife Business",
  description: "Register, manage, and inspect commercial, residential, and industrial sites.",
};

export default async function BusinessPropertiesPage() {
  const business = await getActiveBusiness();

  if (!business) {
    return <RegisterBusinessClient />;
  }

  const rawProperties = await fetchBusinessProperties(String(business.id));
  const properties = (rawProperties || []).map((p: any) => ({
    id: String(p.id),
    business_id: String(p.business_id),
    name: String(p.name),
    code: String(p.code),
    property_type: p.property_type,
    address: String(p.address),
    city: String(p.city),
    state: String(p.state),
    lga_or_district: p.lga_or_district,
    units_count: p.units_count,
    notes: p.notes,
    created_at: p.created_at,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1F2328]">
      <BusinessNav
        businessName={String(business.name || "Enterprise Operations")}
        businessCity={String(business.city || "Port Harcourt")}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyManagerClient
          business={{
            id: String(business.id),
            name: String(business.name),
            city: String(business.city || "Port Harcourt"),
            state: String(business.state || "Rivers State"),
          }}
          properties={properties}
        />
      </main>
    </div>
  );
}
