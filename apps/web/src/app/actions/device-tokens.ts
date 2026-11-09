"use server";

import { fcmService } from "@/lib/notifications/fcm-service";
import { PushNotificationResult } from "@/lib/notifications/types";

export async function registerDeviceTokenAction(params: {
  userId: string;
  deviceToken: string;
  platform: "android" | "ios" | "web";
  deviceName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!params.userId || !params.deviceToken) {
      return { success: false, error: "User ID and Device Token are required." };
    }

    const ok = await fcmService.registerDeviceToken(params);
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
