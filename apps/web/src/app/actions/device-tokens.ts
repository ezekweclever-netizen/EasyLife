"use server";

import { fcmService } from "@/lib/notifications/fcm-service";
import { PushNotificationResult } from "@/lib/notifications/types";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";

export async function registerDeviceTokenAction(params: {
  userId: string;
  deviceToken: string;
  platform: "android" | "ios" | "web";
  deviceName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth?.user) {
      return { success: false, error: "Authentication required." };
    }

    if (!params.deviceToken || (params.userId && params.userId !== auth.user.id)) {
      return { success: false, error: "Invalid user or device token." };
    }

    const ok = await fcmService.registerDeviceToken({
      ...params,
      userId: auth.user.id,
    });
    return { success: ok };
  } catch (err: any) {
    console.error("registerDeviceTokenAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendNewMessagePushAction(params: {
  recipientUserId: string;
  senderName: string;
  messagePreview: string;
  conversationId: string;
}): Promise<PushNotificationResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      success: false,
      provider: "logged_offline",
      status: "failed",
      recipientCount: 0,
      timestamp: new Date().toISOString(),
      error: "Unauthorized: Administrator privileges required.",
    };
  }
  return fcmService.sendPushNotification({
    recipientUserId: params.recipientUserId,
    title: `New message from ${params.senderName}`,
    body: params.messagePreview.slice(0, 100),
    type: "new_message",
    data: {
      conversation_id: params.conversationId,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
  });
}

export async function sendBookingUpdatePushAction(params: {
  recipientUserId: string;
  bookingRef: string;
  statusText: string;
  bookingId: string;
}): Promise<PushNotificationResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      success: false,
      provider: "logged_offline",
      status: "failed",
      recipientCount: 0,
      timestamp: new Date().toISOString(),
      error: "Unauthorized: Administrator privileges required.",
    };
  }
  return fcmService.sendPushNotification({
    recipientUserId: params.recipientUserId,
    title: `Booking Update: ${params.bookingRef}`,
    body: `Your booking status has been updated: ${params.statusText}`,
    type: "booking_update",
    data: {
      booking_id: params.bookingId,
      booking_ref: params.bookingRef,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
  });
}

export async function sendAppointmentReminderPushAction(params: {
  recipientUserId: string;
  bookingRef: string;
  serviceTitle: string;
  appointmentTime: string;
  bookingId: string;
}): Promise<PushNotificationResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      success: false,
      provider: "logged_offline",
      status: "failed",
      recipientCount: 0,
      timestamp: new Date().toISOString(),
      error: "Unauthorized: Administrator privileges required.",
    };
  }
  return fcmService.sendPushNotification({
    recipientUserId: params.recipientUserId,
    title: `Reminder: Upcoming Appointment`,
    body: `${params.serviceTitle} scheduled for ${params.appointmentTime}`,
    type: "appointment_reminder",
    data: {
      booking_id: params.bookingId,
      booking_ref: params.bookingRef,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
  });
}

export async function sendQuotationUpdatePushAction(params: {
  recipientUserId: string;
  bookingRef: string;
  quotationAmountNaira: number;
  quotationId: string;
}): Promise<PushNotificationResult> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      success: false,
      provider: "logged_offline",
      status: "failed",
      recipientCount: 0,
      timestamp: new Date().toISOString(),
      error: "Unauthorized: Administrator privileges required.",
    };
  }
  return fcmService.sendPushNotification({
    recipientUserId: params.recipientUserId,
    title: `New Quotation: ${params.bookingRef}`,
    body: `Quotation received for ₦${params.quotationAmountNaira.toLocaleString("en-NG")}. Tap to review.`,
    type: "quotation_update",
    data: {
      quotation_id: params.quotationId,
      booking_ref: params.bookingRef,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
  });
}
