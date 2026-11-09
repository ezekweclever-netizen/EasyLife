/**
 * EasyLife Paystack Payment Gateway Integration
 * 
 * STRICT COMPLIANCE:
 * - Kept DISABLED by default pending provider commercial arrangement and regulatory checks.
 * - Does not trust frontend payment confirmation.
 * - Enforces HMAC SHA512 webhook signature verification.
 * - Processes transactions idempotently to prevent double-crediting.
 * - Server-side reference generation and verified verification callbacks.
 */

import crypto from "crypto";
import {
  InitializePaymentInput,
  PaymentInitializationResult,
  VerifyPaymentResult,
  RecordRefundInput,
  PaymentTransactionRecord,
} from "./types";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export class PaystackPaymentService {
  private secretKey: string | null;
  private publicKey: string | null;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY?.trim() || null;
    this.publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || null;
  }

  /**
   * Compliance Guard: Checks if online payment functionality is approved and enabled
   */
  isPaymentEnabled(): boolean {
    return process.env.PAYMENTS_ENABLED === "true";
  }

  /**
   * Generates a unique, cryptographically random transaction reference
   */
  generateReference(): string {
    const randomHex = crypto.randomBytes(6).toString("hex").toUpperCase();
    return `trx_easylife_${Date.now()}_${randomHex}`;
  }

  /**
   * Initiates payment on Paystack server-side
   */
  async initializePayment(
    input: InitializePaymentInput
  ): Promise<PaymentInitializationResult> {
    // 1. Enforce Disabled Status if not approved
    if (!this.isPaymentEnabled()) {
      return {
        success: false,
        code: "PAYMENTS_DISABLED_COMPLIANCE",
        is_disabled: true,
        message:
          "Online payment gateway is temporarily disabled pending commercial merchant agreement and regulatory compliance approval.",
      };
    }

    if (!this.secretKey) {
      return {
        success: false,
        error: "Paystack secret key is not configured in environment.",
      };
    }

    const reference = this.generateReference();
    const amountKobo = Math.round(input.amountNaira * 100);

    // 2. Persist initial pending transaction record in database
    try {
      await supabaseAdminFetch("/rest/v1/payment_transactions", {
        method: "POST",
        body: {
          reference,
          booking_id: input.bookingId || null,
          user_id: input.userId,
          amount_kobo: amountKobo,
          currency: "NGN",
          channel: "paystack",
          status: "pending",
          idempotency_key: `init_${reference}`,
          metadata: input.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to record payment transaction: ${err.message}`,
      };
    }

    // 3. Call Paystack Initialize Endpoint
    try {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: input.userEmail,
          amount: amountKobo,
          reference,
          callback_url:
            input.callbackUrl ||
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings/${input.bookingId}?payment_ref=${reference}`,
          metadata: {
            booking_id: input.bookingId,
            user_id: input.userId,
            ...input.metadata,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Paystack HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      if (!json.status || !json.data) {
        throw new Error(json.message || "Paystack initialization failed.");
      }

      return {
        success: true,
        reference,
        authorizationUrl: json.data.authorization_url,
        accessCode: json.data.access_code,
        amountKobo,
        currency: "NGN",
      };
    } catch (err: any) {
      // Mark transaction failed
      await this.updateTransactionStatus(reference, "failed", err.message);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Server-side verified callback: verifies transaction status directly with Paystack
   */
  async verifyTransaction(reference: string): Promise<VerifyPaymentResult> {
    if (!this.isPaymentEnabled()) {
      return {
        success: false,
        status: "failed",
        reference,
        amountKobo: 0,
        channel: "paystack",
        error: "Payments are disabled pending commercial compliance.",
      };
    }

    if (!this.secretKey) {
      return {
        success: false,
        status: "failed",
        reference,
        amountKobo: 0,
        channel: "paystack",
        error: "Paystack secret key is missing.",
      };
    }

    try {
      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Paystack verify HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.status || !json.data) {
        throw new Error(json.message || "Failed to verify transaction.");
      }

      const data = json.data;
      const isSuccess = data.status === "success";
      const status = isSuccess ? "successful" : data.status === "failed" ? "failed" : "pending";

      // Idempotently update database record
      await this.updateTransactionStatus(
        reference,
        status,
        data.gateway_response,
        data.paid_at,
        data.id?.toString()
      );

      return {
        success: isSuccess,
        status,
        reference,
        amountKobo: data.amount,
        channel: data.channel || "card",
        paidAt: data.paid_at,
        gatewayResponse: data.gateway_response,
      };
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        reference,
        amountKobo: 0,
        channel: "paystack",
        error: err.message,
      };
    }
  }

  /**
   * Validates Paystack Webhook HMAC SHA512 Signature using timing-safe comparison
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.secretKey || !signature) return false;
    try {
      const hash = crypto
        .createHmac("sha512", this.secretKey)
        .update(rawBody)
        .digest("hex");
      const hashBuffer = Buffer.from(hash, "utf8");
      const sigBuffer = Buffer.from(signature, "utf8");
      if (hashBuffer.length !== sigBuffer.length) return false;
      return crypto.timingSafeEqual(hashBuffer, sigBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Idempotent Webhook Event Processor
   */
  async processWebhookEvent(event: {
    event: string;
    data: {
      reference: string;
      amount: number;
      status: string;
      paid_at?: string;
      gateway_response?: string;
      id?: number;
    };
  }): Promise<{ processed: boolean; status: string; reason?: string }> {
    const { reference, status, paid_at, gateway_response, id } = event.data;

    // Check existing transaction
    const existingRes = await supabaseAdminFetch<PaymentTransactionRecord[]>(
      `/rest/v1/payment_transactions?select=*&reference=eq.${encodeURIComponent(reference)}`
    );

    const existing = existingRes.ok && existingRes.data?.[0];
    if (!existing) {
      return { processed: false, status: "ignored", reason: "Transaction not found." };
    }

    // Idempotency: Ignore if already marked successful
    if (existing.status === "successful") {
      return { processed: true, status: "already_processed" };
    }

    if (event.event === "charge.success" && status === "success") {
      await this.updateTransactionStatus(
        reference,
        "successful",
        gateway_response || "Approved",
        paid_at || new Date().toISOString(),
        id?.toString()
      );
      return { processed: true, status: "marked_successful" };
    }

    return { processed: true, status: "unhandled_event" };
  }

  /**
   * Records a payment refund
   */
  async recordRefund(input: RecordRefundInput): Promise<boolean> {
    const refundKobo = Math.round(input.refundAmountNaira * 100);
    const res = await supabaseAdminFetch(
      `/rest/v1/payment_transactions?reference=eq.${encodeURIComponent(input.reference)}`,
      {
        method: "PATCH",
        body: {
          status: "refunded",
          refund_amount_kobo: refundKobo,
          refund_reason: input.reason,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }
    );

    return res.ok;
  }

  /**
   * Updates transaction status in database
   */
  private async updateTransactionStatus(
    reference: string,
    status: string,
    gatewayResponse?: string,
    paidAt?: string,
    paystackRef?: string
  ) {
    await supabaseAdminFetch(
      `/rest/v1/payment_transactions?reference=eq.${encodeURIComponent(reference)}`,
      {
        method: "PATCH",
        body: {
          status,
          gateway_response: gatewayResponse || null,
          paid_at: paidAt || null,
          paystack_reference: paystackRef || null,
          updated_at: new Date().toISOString(),
        },
      }
    );
  }

  /**
   * Fetch Transaction History for a user
   */
  async getUserTransactions(userId: string): Promise<PaymentTransactionRecord[]> {
    const res = await supabaseAdminFetch<PaymentTransactionRecord[]>(
      `/rest/v1/payment_transactions?select=*&user_id=eq.${encodeURIComponent(
        userId
      )}&order=created_at.desc&limit=50`
    );

    return res.ok && Array.isArray(res.data) ? res.data : [];
  }
}

export const paystackService = new PaystackPaymentService();
