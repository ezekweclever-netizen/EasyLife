import React from "react";
import type { Metadata } from "next";
import {
  getActiveBusiness,
  fetchBusinessProperties,
  fetchBusinessAssets,
} from "@/app/actions/business";
import { BusinessNav } from "@/components/business/business-nav";
import { AssetManagerClient } from "@/components/business/asset-manager-client";
import { RegisterBusinessClient } from "@/components/business/register-business-client";

export const metadata: Metadata = {
  title: "Equipment & Asset Register — EasyLife Business",
  description:
    "Register and manage HVAC, generators, inverters, solar panels, and facility equipment.",
};

interface AssetsPageProps {
  searchParams?: Promise<{
    propertyId?: string;
    action?: string;
  }>;
}

export default async function BusinessAssetsPage({ searchParams }: AssetsPageProps) {
  const business = await getActiveBusiness();

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-50">
        <RegisterBusinessClient />
      </div>
    );
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const [rawProperties, rawAssets] = await Promise.all([
    fetchBusinessProperties(String(business.id)),
    fetchBusinessAssets(String(business.id), resolvedParams?.propertyId),
  ]);

  const properties = (rawProperties || []).map((p: any) => ({
    id: String(p.id),
    name: String(p.name),
    code: String(p.code),
  }));

  const assets = (rawAssets || []).map((a: any) => ({
    id: String(a.id),
    business_id: String(a.business_id),
    property_id: String(a.property_id),
    asset_category: a.asset_category,
    name: String(a.name),
    asset_tag: String(a.asset_tag),
    brand: a.brand,
    model_number: a.model_number,
    serial_number: a.serial_number,
    location_in_property: a.location_in_property,
    status: a.status,
    installation_date: a.installation_date,
    maintenance_interval_days: a.maintenance_interval_days,
    documents: a.documents,
    notes: a.notes,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <BusinessNav
        businessName={String(business.name || "Enterprise Operations")}
        businessCity={String(business.city || "Port Harcourt")}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AssetManagerClient
          business={{
            id: String(business.id),
            name: String(business.name),
          }}
          properties={properties}
          assets={assets}
          initialPropertyFilter={resolvedParams?.propertyId || "all"}
        />
      </main>
    </div>
  );
}
