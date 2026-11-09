import { NextRequest, NextResponse } from "next/server";
import { paystackService } from "@/lib/payments/paystack-service";

/**
 * Paystack Webhook Handler
 * 
 * Strict requirements:
 * 1. Validates HMAC SHA512 signature in 'x-paystack-signature' against raw request body
 * 2. Processes events idempotently via PaystackPaymentService
 * 3. Never trusts unverified or frontend payment confirmations
 * 4. Responds with 200 OK to acknowledge receipt
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-paystack-signature header." },
        { status: 401 }
      );
    }

    const rawBody = await req.text();
    const isValid = paystackService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.warn("[Paystack Webhook] Invalid webhook signature detected.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    // Process event idempotently
    const result = await paystackService.processWebhookEvent(payload);

    return NextResponse.json(
      {
        received: true,
        event: payload.event,
        reference: payload.data?.reference,
        status: result.status,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[Paystack Webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Internal server error processing webhook." },
      { status: 500 }
    );
  }
}
