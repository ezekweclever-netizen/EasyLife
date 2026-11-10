"use server";

import { verifyAdminSession } from "@/lib/auth/admin-guard";
import { emailService } from "@/lib/email/email-service";
import {
  renderAccountVerificationEmail,
  renderPasswordRecoveryEmail,
  renderBookingConfirmationEmail,
  renderNewQuotationEmail,
  renderAppointmentConfirmationEmail,
  renderVerificationUpdateEmail,
  renderDisputeUpdateEmail,
} from "@/lib/email/templates";
import { EmailDeliveryResult } from "@/lib/email/types";

async function requireAdminEmailAccess(): Promise<EmailDeliveryResult | null> {
  const adminCheck = await verifyAdminSession();
  if (!adminCheck.ok) {
    return {
      success: false,
      provider: "logged_offline",
      status: "failed",
      timestamp: new Date().toISOString(),
      error: "Unauthorized: Administrator privileges required.",
    };
  }
  return null;
}

export async function sendAccountVerificationEmailAction(params: {
  toEmail: string;
  userName: string;
  verificationUrl: string;
  otpCode: string;
}): Promise<EmailDeliveryResult> {
  const denied = await requireAdminEmailAccess();
  if (denied) return denied;
  const tpl = renderAccountVerificationEmail(params);
  return emailService.sendEmail({
    to: params.toEmail,
    subject: tpl.subject,
    type: "account_verification",
    html: tpl.html,
    text: tpl.text,
  });
}

export async function sendPasswordRecoveryEmailAction(params: {
  toEmail: string;
  userName: string;
  resetUrl: string;
}): Promise<EmailDeliveryResult> {
  const denied = await requireAdminEmailAccess();
  if (denied) return denied;
  const tpl = renderPasswordRecoveryEmail(params);
  return emailService.sendEmail({
    to: params.toEmail,
    subject: tpl.subject,
    type: "password_recovery",
    html: tpl.html,
    text: tpl.text,
  });
}

export async function sendBookingConfirmationEmailAction(params: {
  toEmail: string;
  customerName: string;
  bookingRef: string;
  serviceTitle: string;
  professionalName?: string;
  scheduledDate: string;
  address: string;
  totalNaira: number;
}): Promise<EmailDeliveryResult> {
  const denied = await requireAdminEmailAccess();
  if (denied) return denied;
  const tpl = renderBookingConfirmationEmail(params);
  return emailService.sendEmail({
    to: params.toEmail,
    subject: tpl.subject,
    type: "booking_confirmation",
    html: tpl.html,
    text: tpl.text,
  });
}

export async function sendNewQuotationEmailAction(params: {
  toEmail: string;
  customerName: string;
  bookingRef: string;
  professionalName: string;
  totalNaira: number;
  quotationUrl: string;
}): Promise<EmailDeliveryResult> {
  const denied = await requireAdminEmailAccess();
  if (denied) return denied;
  const tpl = renderNewQuotationEmail(params);
  return emailService.sendEmail({
    to: params.toEmail,
    subject: tpl.subject,
    type: "new_quotation",
    html: tpl.html,
    text: tpl.text,
  });
}

export async function sendAppointmentConfirmationEmailAction(params: {
  toEmail: string;
  recipientName: string;
  bookingRef: string;
  serviceTitle: string;
  appointmentTime: string;
  partnerName: string;
  isProfessional: boolean;
}): Promise<EmailDeliveryResult> {
  const denied = await requireAdminEmailAccess();
  if (denied) return denied;
  const tpl = renderAppointmentConfirmationEmail(params);
  return emailService.sendEmail({
    to: params.toEmail,
    subject: tpl.subject,
    type: "appointment_confirmation",
    html: tpl.html,
    text: tpl.text,
  });
}

export async function sendVerificationUpdateEmailAction(params: {
  toEmail: string;
  professionalName: string;
  status: "verified" | "rejected" | "info_required";
  adminNotes?: string;
}): Promise<EmailDeliveryResult> {
  const denied = await requireAdminEmailAccess();
  if (denied) return denied;
  const tpl = renderVerificationUpdateEmail(params);
  return emailService.sendEmail({
    to: params.toEmail,
    subject: tpl.subject,
    type: "verification_update",
    html: tpl.html,
    text: tpl.text,
  });
}

export async function sendDisputeUpdateEmailAction(params: {
  toEmail: string;
  userName: string;
  disputeRef: string;
  bookingRef: string;
  disputeStatus: string;
  resolutionSummary?: string;
}): Promise<EmailDeliveryResult> {
  const denied = await requireAdminEmailAccess();
  if (denied) return denied;
  const tpl = renderDisputeUpdateEmail(params);
  return emailService.sendEmail({
    to: params.toEmail,
    subject: tpl.subject,
    type: "dispute_update",
    html: tpl.html,
    text: tpl.text,
  });
}
