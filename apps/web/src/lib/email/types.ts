/**
 * EasyLife Transactional Email Types
 */

export type TransactionalEmailType =
  | "account_verification"
  | "password_recovery"
  | "booking_confirmation"
  | "new_quotation"
  | "appointment_confirmation"
  | "verification_update"
  | "dispute_update";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailPayload {
  to: string | EmailRecipient;
  subject: string;
  type: TransactionalEmailType;
  html: string;
  text: string;
  variables?: Record<string, any>;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "logged_offline";
  status: "sent" | "logged_offline" | "failed";
  timestamp: string;
  error?: string;
}
