import React from "react";
import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerProfile } from "@/lib/supabase/customer";
import { fetchActiveCategories } from "@/lib/ai/categories";
import { CustomerHeader } from "@/components/customer/customer-header";
import { PublicShell } from "@/components/site/public-shell";
import { AIAssistantChat } from "@/components/assistant/ai-assistant-chat";

export const metadata: Metadata = {
  title: "AI Service & Problem Assistant — EasyLife",
  description:
    "Describe your repair or maintenance problem in everyday words. EasyLife AI recommends accredited trade categories, asks clarifying details, and prepares your service request.",
};

export default async function AIAssistantPage() {
  const [auth, categories] = await Promise.all([
    getAuthenticatedUser(),
    fetchActiveCategories(),
  ]);

  const profile = auth
    ? await getCustomerProfile(auth.user.id, auth.accessToken)
    : null;

  const content = (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <AIAssistantChat
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
        userEmail={auth?.user.email}
        userName={profile?.full_name}
      />
    </div>
  );

  if (auth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
        <CustomerHeader
          user={{
            id: auth.user.id,
            email: auth.user.email,
            fullName: profile?.full_name,
          }}
          selectedCity={profile?.city || "Port Harcourt"}
        />
        <main className="max-w-5xl mx-auto">{content}</main>
      </div>
    );
  }

  return (
    <PublicShell>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">{content}</div>
      </div>
    </PublicShell>
  );
}
