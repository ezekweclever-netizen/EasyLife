/**
 * EasyLife Push Notification Types (FCM for Android & iOS)
 */

export type PushNotificationType =
  | "new_message"
  | "booking_update"
  | "appointment_reminder"
  | "quotation_update";

export interface PushNotificationPayload {
  recipientUserId: string;
  title: string;
  body: string;
  type: PushNotificationType;
  data?: Record<string, string>;
  deviceTokens?: string[];
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  provider: "fcm" | "logged_offline";
  status: "dispatched" | "logged_offline" | "failed";
  recipientCount: number;
  timestamp: string;
  error?: string;
}
