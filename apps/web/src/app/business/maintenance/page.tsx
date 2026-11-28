import React from "react";
import type { Metadata } from "next";
import {
  getActiveBusiness,
  fetchBusinessProperties,
  fetchBusinessAssets,
  fetchBusinessMaintenanceRequests,
  fetchBusinessMaintenanceRecords,
} from "@/app/actions/business";
import { BusinessNav } from "@/components/business/business-nav";
import { MaintenanceManagerClient } from "@/components/business/maintenance-manager-client";
import { RegisterBusinessClient } from "@/components/business/register-business-client";

export const metadata: Metadata = {
  title: "Maintenance & Fault Reporting — EasyLife Business",
  description:
    "Report faults, schedule maintenance, track technician dispatch, and record audited repair invoices.",
};

interface MaintenancePageProps {
  searchParams?: Promise<{
    action?: string;
    propertyId?: string;
    assetId?: string;
  }>;
}

export default async function BusinessMaintenancePage({ searchParams }: MaintenancePageProps) {
  const business = await getActiveBusiness();

  if (!business) {
    return <RegisterBusinessClient />;
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const [rawProperties, rawAssets, rawRequests, rawRecords] = await Promise.all([
    fetchBusinessProperties(String(business.id)),
    fetchBusinessAssets(String(business.id)),
    fetchBusinessMaintenanceRequests(String(business.id), resolvedParams?.propertyId),
    fetchBusinessMaintenanceRecords(String(business.id), resolvedParams?.propertyId),
  ]);

  const properties = (rawProperties || []).map((p: any) => ({
    id: String(p.id),
    name: String(p.name),
    code: String(p.code),
  }));

  const assets = (rawAssets || []).map((a: any) => ({
    id: String(a.id),
    name: String(a.name),
    asset_tag: String(a.asset_tag),
    property_id: String(a.property_id),
  }));

  const requests = (rawRequests || []).map((r: any) => ({
    id: String(r.id),
    business_id: String(r.business_id),
    property_id: String(r.property_id),
    asset_id: r.asset_id ? String(r.asset_id) : null,
    title: String(r.title),
    description: String(r.description),
    fault_severity: r.fault_severity,
    status: r.status,
    scheduled_date: r.scheduled_date,
    estimated_cost_kobo: Number(r.estimated_cost_kobo || 0),
    actual_cost_kobo: Number(r.actual_cost_kobo || 0),
    photos: r.photos,
    created_at: String(r.created_at),
  }));

  const records = (rawRecords || []).map((rec: any) => ({
    id: String(rec.id),
    business_id: String(rec.business_id),
    property_id: String(rec.property_id),
    asset_id: rec.asset_id ? String(rec.asset_id) : null,
    performed_by_name: String(rec.performed_by_name || "EasyLife Verified Pro"),
    maintenance_type: String(rec.maintenance_type),
    summary: String(rec.summary),
    work_performed: String(rec.work_performed),
    parts_replaced: rec.parts_replaced,
    cost_kobo: Number(rec.cost_kobo || 0),
    invoice_number: rec.invoice_number,
    invoice_url: rec.invoice_url,
    performed_at: String(rec.performed_at || rec.created_at),
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1F2328]">
      <BusinessNav
        businessName={String(business.name || "Enterprise Operations")}
        businessCity={String(business.city || "Port Harcourt")}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MaintenanceManagerClient
          business={{
            id: String(business.id),
            name: String(business.name),
          }}
          properties={properties}
          assets={assets}
          requests={requests}
          records={records}
          initialAction={resolvedParams?.action}
          initialPropertyId={resolvedParams?.propertyId}
          initialAssetId={resolvedParams?.assetId}
        />
      </main>
    </div>
  );
}
