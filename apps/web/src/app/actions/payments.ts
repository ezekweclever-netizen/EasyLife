"use server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { paystackService } from "@/lib/payments/paystack-service";
import {
  InitializePaymentInput,
  PaymentInitializationResult,
  VerifyPaymentResult,
  PaymentTransactionRecord,
  RecordRefundInput,
} from "@/lib/payments/types";

/**
 * Initializes a payment transaction server-side.
 * Strictly respects compliance guard: if PAYMENTS_ENABLED !== "true", returns
 * an explicit PAYMENTS_DISABLED_COMPLIANCE error object rather than simulating payment.
 */
export async function initializePaymentAction(
  input: Omit<InitializePaymentInput, "userId" | "userEmail">
): Promise<PaymentInitializationResult> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      success: false,
      error: "Authentication required to initiate payment.",
    };
  }

  // Double check compliance guard
  if (!paystackService.isPaymentEnabled()) {
    return {
      success: false,
      code: "PAYMENTS_DISABLED_COMPLIANCE",
      is_disabled: true,
      message:
        "Online payment gateway is temporarily disabled pending commercial merchant agreement and regulatory compliance approval.",
    };
  }

  return await paystackService.initializePayment({
    ...input,
    userId: auth.user.id,
    userEmail: auth.user.email || "user@easylife.ng",
  });
}

/**
 * Verifies transaction directly with Paystack API.
 * Never trusts client-side confirmation.
 */
export async function verifyPaymentAction(
  reference: string
): Promise<VerifyPaymentResult> {
  if (!reference || !reference.trim()) {
    return {
      success: false,
      status: "failed",
      reference: "",
      amountKobo: 0,
      channel: "paystack",
      error: "Transaction reference is required.",
    };
  }

  return await paystackService.verifyTransaction(reference.trim());
}

/**
 * Fetches transaction history for the currently logged-in user.
 */
export async function fetchUserTransactionsAction(): Promise<{
  success: boolean;
  transactions: PaymentTransactionRecord[];
  error?: string;
}> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      success: false,
      transactions: [],
      error: "Authentication required.",
    };
  }

  try {
    const transactions = await paystackService.getUserTransactions(auth.user.id);
    return {
      success: true,
      transactions,
    };
  } catch (err: any) {
    return {
      success: false,
      transactions: [],
      error: err.message,
    };
  }
}

/**
 * Records an authorized refund (administrative operation)
 */
export async function recordRefundAction(
  input: RecordRefundInput
): Promise<{ success: boolean; message: string }> {
  const adminSession = await verifyAdminSession();
  if (!adminSession.ok) {
    return {
      success: false,
      message: "Administrative privileges required to record a refund.",
    };
  }

  const success = await paystackService.recordRefund(input);
  if (!success) {
    return {
      success: false,
      message: "Failed to record refund in database.",
    };
  }

  return {
    success: true,
    message: "Refund recorded successfully.",
  };
}
