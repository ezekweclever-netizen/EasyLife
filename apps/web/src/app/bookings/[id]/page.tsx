import React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCustomerBookingById, getCustomerProfile } from "@/lib/supabase/customer";
import { CustomerHeader } from "@/components/customer/customer-header";
import { BookingDetailClient } from "@/components/booking/booking-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Booking Details — EasyLife`,
    description: `Track service request status, quotations, and appointments for booking ${id}.`,
  };
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    redirect("/login?next=/bookings");
  }

  const { id } = await params;

  const [booking, profile] = await Promise.all([
    getCustomerBookingById(id, auth.user.id, auth.accessToken),
    getCustomerProfile(auth.user.id, auth.accessToken),
  ]);

  if (!booking) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 lg:pb-12 text-[#0F172A]">
      <CustomerHeader
        user={{
          id: auth.user.id,
          email: auth.user.email,
          fullName: profile?.full_name ?? undefined,
        }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingDetailClient
          booking={booking}
          customerEmail={auth.user.email ?? undefined}
        />
      </main>
    </div>
  );
}
