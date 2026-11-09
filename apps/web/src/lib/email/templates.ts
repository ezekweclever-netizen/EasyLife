/**
 * EasyLife Transactional Email Templates
 * Responsive, clean HTML and plain-text templates matching the EasyLife design system.
 */

import { TransactionalEmailType } from "./types";

const BRAND_COLOR = "#0D9488";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://easylife.ng";

function baseHtmlLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header h1 span { color: #2dd4bf; }
    .body { padding: 32px; font-size: 14px; line-height: 1.6; color: #334155; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; margin: 20px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b; }
    .alert { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px; font-size: 13px; color: #92400e; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EasyLife <span>Nigeria</span></h1>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>EasyLife Marketplace • Port Harcourt • Lagos • Abuja</p>
      <p>This is a transactional notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

export function renderAccountVerificationEmail(params: {
  userName: string;
  verificationUrl: string;
  otpCode?: string;
}): { html: string; text: string; subject: string } {
  const code = params.otpCode || "123456";
  const subject = "Verify your EasyLife account";
  const html = baseHtmlLayout(
    subject,
    `<h2>Welcome to EasyLife, ${params.userName}!</h2>
    <p>Please verify your email address to activate your account and start booking verified artisans or offering professional services.</p>
    <div class="card" style="text-align: center;">
      <span style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold;">Your 6-Digit Verification Code</span>
      <div style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #0d9488; margin-top: 8px;">${code}</div>
    </div>
    <p style="text-align: center;">
      <a href="${params.verificationUrl}" class="btn">Verify Account Online →</a>
    </p>
    <p style="font-size: 12px; color: #64748b;">This verification code will expire in 15 minutes.</p>`
  );

  const text = `Welcome to EasyLife, ${params.userName}!\nYour verification code is: ${code}\nVerify online: ${params.verificationUrl}`;
  return { html, text, subject };
}

export function renderPasswordRecoveryEmail(params: {
  userName: string;
  resetUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = "Reset your EasyLife account password";
  const html = baseHtmlLayout(
    subject,
    `<h2>Password Reset Request</h2>
    <p>Hello ${params.userName}, we received a request to reset your EasyLife account password.</p>
    <p style="text-align: center;">
      <a href="${params.resetUrl}" class="btn">Reset Password →</a>
    </p>
    <div class="alert">
      <strong>Security notice:</strong> If you did not initiate this request, please ignore this email. Your password will remain unchanged.
    </div>`
  );

  const text = `Hello ${params.userName},\nReset your password here: ${params.resetUrl}\nIf you did not request this, ignore this email.`;
  return { html, text, subject };
}

export function renderBookingConfirmationEmail(params: {
  customerName: string;
  bookingRef: string;
  serviceTitle: string;
  professionalName?: string;
  scheduledDate: string;
  address: string;
  totalNaira: number;
}): { html: string; text: string; subject: string } {
  const subject = `Booking Confirmed: ${params.bookingRef} — ${params.serviceTitle}`;
  const html = baseHtmlLayout(
    subject,
    `<h2>Service Booking Confirmed!</h2>
    <p>Hello ${params.customerName}, your service request has been confirmed and scheduled.</p>
    <div class="card">
      <p><strong>Booking Ref:</strong> ${params.bookingRef}</p>
      <p><strong>Service:</strong> ${params.serviceTitle}</p>
      ${params.professionalName ? `<p><strong>Assigned Professional:</strong> ${params.professionalName}</p>` : ""}
      <p><strong>Date & Time:</strong> ${params.scheduledDate}</p>
      <p><strong>Location:</strong> ${params.address}</p>
      <p><strong>Amount:</strong> ₦${Number(params.totalNaira || 0).toLocaleString("en-NG")}</p>
    </div>
    <div class="alert">
      🛡️ <strong>EasyLife Escrow Protection:</strong> Your funds are held securely. You will release payout using your 4-digit Job Completion PIN only after inspecting finished work.
    </div>
    <p style="text-align: center;">
      <a href="${APP_URL}/bookings" class="btn">View Booking Details →</a>
    </p>`
  );

  const text = `Booking Confirmed: ${params.bookingRef}\nService: ${params.serviceTitle}\nDate: ${params.scheduledDate}\nView online: ${APP_URL}/bookings`;
  return { html, text, subject };
}

export function renderNewQuotationEmail(params: {
  customerName: string;
  bookingRef: string;
  professionalName: string;
  totalNaira: number;
  quotationUrl: string;
}): { html: string; text: string; subject: string } {
  const subject = `New Quotation Received for ${params.bookingRef}`;
  const html = baseHtmlLayout(
    subject,
    `<h2>New Quotation from ${params.professionalName}</h2>
    <p>Hello ${params.customerName}, an itemized quotation has been submitted for your review.</p>
    <div class="card">
      <p><strong>Booking Reference:</strong> ${params.bookingRef}</p>
      <p><strong>Quotation Total:</strong> ₦${Number(params.totalNaira || 0).toLocaleString("en-NG")}</p>
      <p><strong>Artisan:</strong> ${params.professionalName}</p>
    </div>
    <p>Please inspect the itemized breakdown (Labour, Materials, and Logistics) and choose whether to accept or decline.</p>
    <p style="text-align: center;">
      <a href="${params.quotationUrl}" class="btn">Review & Accept Quotation →</a>
    </p>`
  );

  const text = `New Quotation from ${params.professionalName} for ${params.bookingRef}\nTotal: ₦${params.totalNaira.toLocaleString("en-NG")}\nReview at: ${params.quotationUrl}`;
  return { html, text, subject };
}

export function renderAppointmentConfirmationEmail(params: {
  recipientName: string;
  bookingRef: string;
  serviceTitle: string;
  appointmentTime: string;
  partnerName: string;
  isProfessional: boolean;
}): { html: string; text: string; subject: string } {
  const subject = `Appointment Confirmed: ${params.bookingRef} on ${params.appointmentTime}`;
  const html = baseHtmlLayout(
    subject,
    `<h2>Appointment Confirmed!</h2>
    <p>Hello ${params.recipientName}, your appointment has been confirmed.</p>
    <div class="card">
      <p><strong>Service:</strong> ${params.serviceTitle}</p>
      <p><strong>Scheduled Time:</strong> ${params.appointmentTime}</p>
      <p><strong>${params.isProfessional ? "Customer" : "Technician"}:</strong> ${params.partnerName}</p>
      <p><strong>Ref Code:</strong> ${params.bookingRef}</p>
    </div>
    <p style="text-align: center;">
      <a href="${APP_URL}/bookings" class="btn">Manage Appointment →</a>
    </p>`
  );

  const text = `Appointment Confirmed: ${params.bookingRef}\nTime: ${params.appointmentTime}\nDetails: ${APP_URL}/bookings`;
  return { html, text, subject };
}

export function renderVerificationUpdateEmail(params: {
  professionalName: string;
  status: "verified" | "rejected" | "info_required";
  adminNotes?: string;
}): { html: string; text: string; subject: string } {
  const isApproved = params.status === "verified";
  const subject = isApproved
    ? "Congratulations! Your EasyLife Professional Profile is Verified"
    : "Update Regarding Your EasyLife Professional Verification";

  const html = baseHtmlLayout(
    subject,
    `<h2>${isApproved ? "🎉 Profile Verified!" : "Verification Status Update"}</h2>
    <p>Hello ${params.professionalName},</p>
    ${
      isApproved
        ? `<p>Your identity, trade accreditation, and address documents have been verified by our compliance team. Your profile now features the <strong>Verified Pro</strong> badge and is publicly listed across Port Harcourt, Lagos, and Abuja.</p>`
        : `<p>Our verification team has reviewed your submitted documents. Status: <strong>${params.status.toUpperCase()}</strong>.</p>
           ${params.adminNotes ? `<div class="card"><strong>Reviewer Notes:</strong><p>${params.adminNotes}</p></div>` : ""}`
    }
    <p style="text-align: center;">
      <a href="${APP_URL}/pro/profile" class="btn">View Professional Dashboard →</a>
    </p>`
  );

  const text = `Verification update for ${params.professionalName}: ${params.status.toUpperCase()}\nNotes: ${params.adminNotes || "N/A"}\nDashboard: ${APP_URL}/pro/profile`;
  return { html, text, subject };
}

export function renderDisputeUpdateEmail(params: {
  userName: string;
  disputeRef: string;
  bookingRef: string;
  disputeStatus: string;
  resolutionSummary?: string;
}): { html: string; text: string; subject: string } {
  const subject = `Dispute Update: Case ${params.disputeRef} (${params.disputeStatus.toUpperCase()})`;
  const html = baseHtmlLayout(
    subject,
    `<h2>Dispute Case Status Update</h2>
    <p>Hello ${params.userName}, an update has been recorded on your service case.</p>
    <div class="card">
      <p><strong>Dispute Ref:</strong> ${params.disputeRef}</p>
      <p><strong>Booking Ref:</strong> ${params.bookingRef}</p>
      <p><strong>Current Status:</strong> <span style="text-transform: uppercase; font-weight: bold;">${params.disputeStatus}</span></p>
      ${params.resolutionSummary ? `<p><strong>Administrator Determination:</strong> ${params.resolutionSummary}</p>` : ""}
    </div>
    <div class="alert">
      ⚖️ <strong>Escrow Protection Active:</strong> Escrow payout remains protected under administrative oversight until binding resolution.
    </div>
    <p style="text-align: center;">
      <a href="${APP_URL}/bookings" class="btn">View Dispute Case →</a>
    </p>`
  );

  const text = `Dispute Case Update: ${params.disputeRef}\nStatus: ${params.disputeStatus}\nView at: ${APP_URL}/bookings`;
  return { html, text, subject };
}

export function renderEmailTemplate(
  type: TransactionalEmailType,
  data: any
): { html: string; text: string; subject: string } {
  switch (type) {
    case "account_verification":
      return renderAccountVerificationEmail({
        userName: data.name || data.userName || "Customer",
        verificationUrl: data.verificationUrl,
      });
    case "password_recovery":
      return renderPasswordRecoveryEmail({
        userName: data.name || data.userName || "User",
        resetUrl: data.resetUrl,
      });
    case "booking_confirmation":
      return renderBookingConfirmationEmail({
        customerName: data.name || data.customerName || "Customer",
        bookingRef: data.bookingId || data.bookingRef || "BK-EASYLIFE",
        serviceTitle: data.serviceCategory || data.serviceTitle || "General Maintenance",
        address: data.serviceAddress || data.address || "Port Harcourt",
        scheduledDate: data.scheduledDate || "As agreed",
        totalNaira: typeof data.totalNaira === "number" ? data.totalNaira : Number(String(data.estimatedCost || "0").replace(/[^0-9.]/g, "")) || 0,
        professionalName: data.professionalName,
      });
    case "new_quotation":
      return renderNewQuotationEmail({
        customerName: data.name || data.customerName || "Customer",
        bookingRef: data.bookingId || data.bookingRef || "BK-EASYLIFE",
        professionalName: data.professionalName || "Verified Professional",
        totalNaira: typeof data.totalNaira === "number" ? data.totalNaira : Number(String(data.totalAmount || "0").replace(/[^0-9.]/g, "")) || 0,
        quotationUrl: data.quotationUrl || `${APP_URL}/bookings`,
      });
    case "appointment_confirmation":
      return renderAppointmentConfirmationEmail({
        recipientName: data.name || data.customerName || "Customer",
        bookingRef: data.bookingId || data.bookingRef || "BK-EASYLIFE",
        serviceTitle: data.serviceCategory || data.serviceTitle || "General Maintenance",
        appointmentTime: `${data.appointmentDate || "Scheduled Date"} ${data.timeSlot ? `(${data.timeSlot})` : ""}`.trim(),
        partnerName: data.professionalName || "Verified Professional",
        isProfessional: Boolean(data.isProfessional),
      });
    case "verification_update":
      return renderVerificationUpdateEmail({
        professionalName: data.professionalName || "Professional",
        status: data.status || "reviewed",
        adminNotes: data.notes || data.adminNotes,
      });
    case "dispute_update":
      return renderDisputeUpdateEmail({
        userName: data.name || data.userName || "User",
        disputeRef: data.disputeId || data.disputeRef || "DSP-EASYLIFE",
        bookingRef: data.bookingId || data.bookingRef || "BK-EASYLIFE",
        disputeStatus: data.status || data.disputeStatus || "under_review",
        resolutionSummary: data.notes || data.resolutionSummary,
      });
    default:
      throw new Error(`Unsupported email template type: ${type}`);
  }
}
