/**
 * EasyLife Transactional Email Service
 * Integrates Resend API with robust logging and offline fallback.
 */

import { EmailPayload, EmailDeliveryResult } from "./types";

export class EmailService {
  private apiKey: string | null;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY?.trim() || null;
    this.fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "EasyLife Nigeria <notifications@easylife.ng>";
  }

  async sendEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
    const toAddress = typeof payload.to === "string" ? payload.to : payload.to.email;
    const timestamp = new Date().toISOString();

    // 1. Live Resend Delivery if API key configured
    if (this.apiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: this.fromEmail,
            to: [toAddress],
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Resend API HTTP ${res.status}: ${errText}`);
        }

        const data = await res.json();
        return {
          success: true,
          messageId: data.id || `resend-${Date.now()}`,
          provider: "resend",
          status: "sent",
          timestamp,
        };
      } catch (err: any) {
        console.warn("Live Resend delivery failed, falling back to offline transport log:", err.message);
      }
    }

    // 2. Offline / Development Fallback Transport
    const mockId = `mock-email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[EmailService] Logged offline email [${payload.type}] to ${toAddress}: "${payload.subject}" (ID: ${mockId})`);

    return {
      success: true,
      messageId: mockId,
      provider: "logged_offline",
      status: "logged_offline",
      timestamp,
    };
  }
}

export const emailService = new EmailService();
