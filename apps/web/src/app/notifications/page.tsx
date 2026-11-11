import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerProfile } from "@/lib/supabase/customer";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/supabase/notifications";
import { CustomerHeader } from "@/components/customer/customer-header";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications — EasyLife",
  description: "Stay updated with booking requests, quotations, messages, and job updates.",
};

export default async function NotificationsPage() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/notifications");
  }

  const [profile, notifications, unreadCount] = await Promise.all([
    getCustomerProfile(auth.user.id, auth.accessToken),
    getUserNotifications(auth.user.id, auth.accessToken, 50),
    getUnreadNotificationCount(auth.user.id, auth.accessToken),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name,
        }}
        unreadNotificationsCount={unreadCount}
        selectedCity={profile?.city || "Port Harcourt"}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Activity Feed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-0.5">
              Notifications &amp; Alerts
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Multi-channel delivery log across in-app, email, and mobile SMS/WhatsApp dispatch
            </p>
          </div>

          <Link
            href="/messages"
            className="self-start sm:self-auto px-4 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#0F172A] hover:bg-slate-50 transition"
          >
            Go to Messages →
          </Link>
        </div>

        <NotificationsClient initialNotifications={notifications} initialUnreadCount={unreadCount} />
      </main>
    </div>
  );
}
