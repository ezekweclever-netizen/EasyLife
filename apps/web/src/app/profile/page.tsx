import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerProfile } from "@/lib/supabase/customer";
import { CustomerHeader } from "@/components/customer/customer-header";
import { updateCustomerProfileAction, logoutAction } from "@/app/actions/profile";

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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 lg:pb-12 text-[#0F172A]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
        }}
        selectedCity={profile?.city || "Port Harcourt"}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">Profile Settings</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage your personal details, primary service city, and address
          </p>
        </div>

        {/* Profile Card Form */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-[#F1F5F9]">
            <div className="w-16 h-16 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-black text-2xl shadow-sm uppercase">
              {profile?.full_name ? profile.full_name[0] : (auth.user.email ? auth.user.email[0] : "C")}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                {profile?.full_name || "EasyLife Customer"}
              </h2>
              <p className="text-xs text-[#64748B]">{auth.user.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]">
                Customer Account
              </span>
            </div>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              await updateCustomerProfileAction({ status: "idle", message: "" }, formData);
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  defaultValue={profile?.full_name || ""}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="displayName" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Display / Preferred Name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  defaultValue={profile?.display_name || ""}
                  placeholder="How should technicians address you?"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={auth.user.email || ""}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] text-sm text-[#64748B] cursor-not-allowed"
                />
                <span className="text-[10px] text-[#94A3B8]">Managed through authentication provider</span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Nigerian Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={profile?.phone || ""}
                  placeholder="+234 800 000 0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Primary Service City
                </label>
                <select
                  id="city"
                  name="city"
                  defaultValue={profile?.city || "Port Harcourt"}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="Port Harcourt">Port Harcourt (Rivers State)</option>
                  <option value="Lagos">Lagos (Lagos State)</option>
                  <option value="Abuja">Abuja (Federal Capital Territory)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="addressLine" className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
                  Default Property Address
                </label>
                <input
                  id="addressLine"
                  name="addressLine"
                  type="text"
                  defaultValue={profile?.address_line || ""}
                  placeholder="Street / Estate / Flat address"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#F1F5F9]">
              <span className="text-xs text-[#64748B]">
                All data stored securely on Supabase
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#0F766E] text-white hover:bg-[#0D655E] transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
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
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
