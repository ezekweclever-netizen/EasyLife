import React from "react";
import type { Metadata } from "next";
import { getActiveBusiness, fetchBusinessTeam } from "@/app/actions/business";
import { BusinessNav } from "@/components/business/business-nav";
import { TeamManagerClient } from "@/components/business/team-manager-client";
import { RegisterBusinessClient } from "@/components/business/register-business-client";

export const metadata: Metadata = {
  title: "Team & Role Access — EasyLife Business",
  description: "Manage facility managers, engineers, permissions, and team invitations.",
};

export default async function BusinessTeamPage() {
  const business = await getActiveBusiness();

  if (!business) {
    return <RegisterBusinessClient />;
  }

  const { members: rawMembers, invitations: rawInvitations } = await fetchBusinessTeam(
    String(business.id)
  );

  const members = (rawMembers || []).map((m: any) => ({
    id: String(m.id),
    business_id: String(m.business_id),
    user_id: String(m.user_id),
    role: m.member_role || m.role,
    permissions: m.permissions,
    created_at: String(m.created_at),
    profiles: m.profiles
      ? {
          id: String(m.profiles.id),
          email: m.profiles.email,
          full_name: m.profiles.full_name,
        }
      : null,
  }));

  const invitations = (rawInvitations || []).map((inv: any) => ({
    id: String(inv.id),
    business_id: String(inv.business_id),
    email: String(inv.email),
    role: inv.role,
    permissions: Array.isArray(inv.permissions) ? inv.permissions : [],
    status: String(inv.status),
    created_at: String(inv.created_at),
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1F2328]">
      <BusinessNav
        businessName={String(business.name || "Enterprise Operations")}
        businessCity={String(business.city || "Port Harcourt")}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamManagerClient
          business={{
            id: String(business.id),
            name: String(business.name),
          }}
          members={members}
          invitations={invitations}
        />
      </main>
    </div>
  );
}
