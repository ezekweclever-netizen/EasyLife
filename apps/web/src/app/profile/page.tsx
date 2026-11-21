import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerProfile } from "@/lib/supabase/customer";
import { CustomerHeader } from "@/components/customer/customer-header";
import { ProfileFormClient } from "@/components/customer/profile-form-client";
import { ProfilePhotoUploader } from "@/components/ui/profile-photo-uploader";
import { logoutAction } from "@/app/actions/profile";

export const metadata: Metadata = {
  title: "Customer Profile — EasyLife",
  description: "View and edit your EasyLife profile, service locations, and account preferences.",
};

export default async function CustomerProfilePage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/profile");
  }

  const profile = await getCustomerProfile(auth.user.id, auth.accessToken);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
          avatarUrl: profile?.avatar_url,
          primaryRole: profile?.primary_role,
        }}
        selectedCity={profile?.city || "Port Harcourt"}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white">Profile Settings</h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
            Manage your personal details, profile photo, primary service city, and address
          </p>
        </div>

        {/* Profile Card Form */}
        <div className="bg-white dark:bg-[#0E2238] rounded-3xl border border-[#E2E8F0] dark:border-[#163654] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-6 border-b border-[#F1F5F9] dark:border-slate-800">
            <ProfilePhotoUploader
              currentAvatarUrl={profile?.avatar_url}
              fallbackInitial={profile?.full_name ? profile.full_name[0] : (auth.user.email ? auth.user.email[0] : "C")}
              size="lg"
            />
          </div>

          <ProfileFormClient
            email={auth.user.email || ""}
            initialFullName={profile?.full_name || ""}
            initialDisplayName={profile?.display_name || ""}
            initialPhone={profile?.phone || ""}
            initialCity={profile?.city || "Port Harcourt"}
            initialAddressLine={profile?.address_line || ""}
          />
        </div>

        {/* Account & Sign out Section */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Sign Out</h3>
            <p className="text-xs text-[#64748B]">Sign out of your customer session on this device</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
