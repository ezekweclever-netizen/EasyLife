/**
 * EasyLife Paystack Payment Integration Types
 */

export interface InitializePaymentInput {
  bookingId: string;
  userId: string;
  userEmail: string;
  amountNaira: number;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface PaymentInitializationResult {
  success: boolean;
  reference?: string;
  authorizationUrl?: string;
  accessCode?: string;
  amountKobo?: number;
  currency?: "NGN";
  code?: string;
  is_disabled?: boolean;
  message?: string;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  status: "successful" | "failed" | "pending" | "abandoned";
  reference: string;
  amountKobo: number;
  channel: string;
  paidAt?: string;
  gatewayResponse?: string;
  error?: string;
}

export interface RecordRefundInput {
  reference: string;
  refundAmountNaira: number;
  reason: string;
}

export interface PaymentTransactionRecord {
  id: string;
  reference: string;
  booking_id: string | null;
  user_id: string;
  amount_kobo: number;
  currency: string;
  channel: string;
  status: "pending" | "processing" | "successful" | "failed" | "refunded" | "abandoned";
  paystack_reference: string | null;
  gateway_response: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refund_amount_kobo: number;
  refund_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
