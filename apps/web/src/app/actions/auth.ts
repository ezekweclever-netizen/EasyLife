"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  validateLogin,
  validateRegistration,
  validateContact,
  type FormActionState,
  type LoginField,
  type RegisterField,
  type ContactField,
} from "@/lib/validation/forms";
import {
  checkRateLimit,
  RATE_LIMIT_POLICIES,
} from "@/lib/security/rate-limit";
import {
  getSupabasePublicConfig,
  supabaseFetch,
} from "@/lib/supabase/rest";
import {
  persistSession,
  clearSession,
  isSessionPayload,
} from "@/lib/auth/session";
import { resolveUserDashboardPath } from "@/lib/auth/admin-guard";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { emailService } from "@/lib/email/email-service";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export async function loginAction(
  _prevState: FormActionState<LoginField>,
  formData: FormData
): Promise<FormActionState<LoginField>> {
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    raw[key] = value;
  });

  const validation = validateLogin(raw);
  if (!validation.ok) {
    return {
      status: "error",
      message: "Please check your login details and try again.",
      fieldErrors: validation.fieldErrors,
      values: { email: String(raw.email ?? "") },
    };
  }

  const { email, password } = validation.data;
  const clientIp = await getClientIp();

  // Rate limit by IP + email key to prevent brute-force
  const rateLimitResult = checkRateLimit(
    RATE_LIMIT_POLICIES.AUTH_ATTEMPT,
    `${clientIp}:${email}`
  );

  if (!rateLimitResult.allowed) {
    return {
      status: "error",
      message: `Too many login attempts. Please wait ${rateLimitResult.retryAfterSeconds} seconds before trying again.`,
      fieldErrors: {},
      values: { email },
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message:
        "The EasyLife authentication backend is not configured in this environment (missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      fieldErrors: {},
      values: { email },
    };
  }

  const res = await supabaseFetch<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id: string; email?: string };
    error_description?: string;
    message?: string;
  }>(config, "/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });

  if (!res.ok) {
    const errorMsg = res.message || "";
    if (
      errorMsg.toLowerCase().includes("email not confirmed") ||
      errorMsg.toLowerCase().includes("not confirmed")
    ) {
      return {
        status: "error",
        message:
          "Your email address has not been verified. Please check your inbox and verify your email before logging in.",
        fieldErrors: {},
        values: { email },
      };
    }

    return {
      status: "error",
      message:
        res.status === 400
          ? "Invalid email or password. Please check your credentials."
          : res.message || "Failed to log in. Please try again.",
      fieldErrors: {},
      values: { email },
    };
  }

  if (isSessionPayload(res.data)) {
    // Enforce email verification for password sign-ins
    const user = res.data.user as {
      id: string;
      email?: string;
      email_confirmed_at?: string | null;
      confirmed_at?: string | null;
      app_metadata?: { provider?: string; providers?: string[] };
    };

    const isConfirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
    const isGoogle = user.app_metadata?.provider === "google" || user.app_metadata?.providers?.includes("google");

    if (!isConfirmed && !isGoogle) {
      return {
        status: "error",
        message:
          "Your email address has not been verified. Please check your inbox and verify your email before logging in.",
        fieldErrors: {},
        values: { email },
      };
    }

    await persistSession(res.data);

    const rawNext = typeof raw.next === "string" ? raw.next : null;
    const nextPath =
      rawNext &&
      rawNext.startsWith("/") &&
      !rawNext.startsWith("//") &&
      !rawNext.startsWith("/\\")
        ? rawNext
        : null;
    if (nextPath && !nextPath.startsWith("/login") && !nextPath.startsWith("/admin/login")) {
      redirect(nextPath);
    }

    const destination = await resolveUserDashboardPath(res.data.user.id, res.data.access_token);
    redirect(destination);
  } else {
    return {
      status: "error",
      message: "Unexpected response from authentication server.",
      fieldErrors: {},
      values: { email },
    };
  }
}

export async function adminLoginAction(
  _prevState: FormActionState<LoginField>,
  formData: FormData
): Promise<FormActionState<LoginField>> {
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    raw[key] = value;
  });

  const validation = validateLogin(raw);
  if (!validation.ok) {
    return {
      status: "error",
      message: "Please enter a valid administrator email and password.",
      fieldErrors: validation.fieldErrors,
      values: { email: String(raw.email ?? "") },
    };
  }

  const { email, password } = validation.data;
  const clientIp = await getClientIp();

  const rateLimitResult = checkRateLimit(
    RATE_LIMIT_POLICIES.AUTH_ATTEMPT,
    `admin:${clientIp}:${email}`
  );

  if (!rateLimitResult.allowed) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Please wait ${rateLimitResult.retryAfterSeconds} seconds.`,
      fieldErrors: {},
      values: { email },
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message: "Supabase authentication environment variables are missing.",
      fieldErrors: {},
      values: { email },
    };
  }

  const res = await supabaseFetch<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id: string; email?: string };
  }>(config, "/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });

  if (!res.ok) {
    return {
      status: "error",
      message:
        res.status === 400
          ? "Invalid administrator email or password."
          : res.message || "Authentication failed.",
      fieldErrors: {},
      values: { email },
    };
  }

  if (!isSessionPayload(res.data)) {
    return {
      status: "error",
      message: "Unexpected response from authentication server.",
      fieldErrors: {},
      values: { email },
    };
  }

  // Verify admin privileges strictly before persisting admin session
  const [profileRes, roleRes] = await Promise.all([
    supabaseAdminFetch<Array<{ primary_role: string | null; is_suspended: boolean }>>(
      `/rest/v1/profiles?id=eq.${res.data.user.id}&limit=1&select=primary_role,is_suspended`
    ),
    supabaseAdminFetch<Array<{ role: string }>>(
      `/rest/v1/user_roles?user_id=eq.${res.data.user.id}&role=eq.admin&is_active=eq.true&limit=1&select=role`
    ),
  ]);

  const profile =
    profileRes.ok && Array.isArray(profileRes.data) && profileRes.data[0]
      ? profileRes.data[0]
      : null;
  const hasAdminRole =
    roleRes.ok && Array.isArray(roleRes.data) && roleRes.data.length > 0;

  if (profile?.is_suspended) {
    return {
      status: "error",
      message: "This administrator account has been suspended.",
      fieldErrors: {},
      values: { email },
    };
  }

  if (profile?.primary_role !== "admin" && !hasAdminRole) {
    await clearSession();
    return {
      status: "error",
      message:
        "Access denied: This account does not have Administrator privileges. Please use a customer or professional login.",
      fieldErrors: {},
      values: { email },
    };
  }

  await persistSession(res.data);
  const nextPath =
    typeof raw.next === "string" && raw.next.startsWith("/admin") && raw.next !== "/admin/login"
      ? raw.next
      : "/admin";
  redirect(nextPath);
}

export async function registerAction(
  _prevState: FormActionState<RegisterField>,
  formData: FormData
): Promise<FormActionState<RegisterField>> {
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    raw[key] = value;
  });

  const validation = validateRegistration(raw);
  if (!validation.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted errors to create your account.",
      fieldErrors: validation.fieldErrors,
      values: {
        fullName: String(raw.fullName ?? ""),
        email: String(raw.email ?? ""),
        phone: String(raw.phone ?? ""),
        role: String(raw.role ?? ""),
        city: String(raw.city ?? ""),
      },
    };
  }

  const { fullName, email, phone, password, role, city, state } = validation.data;
  const clientIp = await getClientIp();

  const rateLimitResult = checkRateLimit(
    RATE_LIMIT_POLICIES.REGISTRATION_ATTEMPT,
    clientIp
  );

  if (!rateLimitResult.allowed) {
    return {
      status: "error",
      message: `Too many sign-up requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds before trying again.`,
      fieldErrors: {},
      values: { fullName, email, phone: phone ?? "", role, city },
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message:
        "The EasyLife backend is not configured in this environment (missing Supabase environment variables).",
      fieldErrors: {},
      values: { fullName, email, phone: phone ?? "", role, city },
    };
  }

  const res = await supabaseFetch<{
    id?: string;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id: string; email?: string };
  }>(config, "/auth/v1/signup", {
    method: "POST",
    body: {
      email,
      password,
      data: {
        full_name: fullName,
        role,
        city,
        state,
        phone,
      },
    },
  });

  if (!res.ok) {
    return {
      status: "error",
      message:
        res.status === 422 || res.message.toLowerCase().includes("already registered")
          ? "An account with this email address already exists. Please log in instead."
          : res.message || "Failed to create account. Please try again.",
      fieldErrors: {},
      values: { fullName, email, phone: phone ?? "", role, city },
    };
  }

  if (isSessionPayload(res.data)) {
    await persistSession(res.data);
    const destination = await resolveUserDashboardPath(res.data.user.id, res.data.access_token);
    redirect(destination);
  }

  return {
    status: "success",
    message:
      "Your EasyLife account has been registered. If email confirmation is enabled on this project, please check your inbox to activate your account before logging in.",
    values: {},
  };
}

export async function contactAction(
  _prevState: FormActionState<ContactField>,
  formData: FormData
): Promise<FormActionState<ContactField>> {
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    raw[key] = value;
  });

  const validation = validateContact(raw);
  if (!validation.ok) {
    return {
      status: "error",
      message: "Please complete all required fields correctly.",
      fieldErrors: validation.fieldErrors,
      values: {
        fullName: String(raw.fullName ?? ""),
        email: String(raw.email ?? ""),
        phone: String(raw.phone ?? ""),
        inquiryType: String(raw.inquiryType ?? ""),
        city: String(raw.city ?? ""),
        subject: String(raw.subject ?? ""),
        message: String(raw.message ?? ""),
      },
    };
  }

  const clientIp = await getClientIp();
  const rateLimitResult = checkRateLimit(
    RATE_LIMIT_POLICIES.CONTACT_SUBMISSION,
    clientIp
  );

  if (!rateLimitResult.allowed) {
    return {
      status: "error",
      message: `You have submitted multiple inquiries recently. Please wait ${rateLimitResult.retryAfterSeconds} seconds before sending another message.`,
      fieldErrors: {},
      values: {
        fullName: validation.data.fullName,
        email: validation.data.email,
        phone: validation.data.phone ?? "",
        inquiryType: validation.data.inquiryType,
        city: validation.data.city ?? "",
        subject: validation.data.subject,
        message: validation.data.message,
      },
    };
  }

  const ticketRef = `TKT-WEB-${Date.now().toString(36).toUpperCase()}`;
  const formattedBody = [
    `Sender: ${validation.data.fullName} <${validation.data.email}>`,
    validation.data.phone ? `Phone: ${validation.data.phone}` : null,
    `Inquiry Type: ${validation.data.inquiryType}`,
    validation.data.city ? `City Hub: ${validation.data.city}` : null,
    "",
    validation.data.message,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const ticketRes = await supabaseAdminFetch("/rest/v1/support_tickets", {
    method: "POST",
    body: {
      ticket_ref: ticketRef,
      session_id: `web-contact-${clientIp}`,
      subject: `[${validation.data.inquiryType}] ${validation.data.subject}`,
      category: "general",
      priority: "medium",
      status: "open",
      user_message: formattedBody,
      ai_summary: `Web contact inquiry from ${validation.data.fullName} (${validation.data.email}) — ${validation.data.city || "Nigeria"}`,
    },
  });

  if (!ticketRes.ok) {
    return {
      status: "error",
      message: "We could not record your inquiry right now. Please try again shortly.",
      fieldErrors: {},
      values: {
        fullName: validation.data.fullName,
        email: validation.data.email,
        phone: validation.data.phone ?? "",
        inquiryType: validation.data.inquiryType,
        city: validation.data.city ?? "",
        subject: validation.data.subject,
        message: validation.data.message,
      },
    };
  }

  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  await emailService.sendEmail({
    to: "support@easylife.ng",
    type: "booking_confirmation",
    subject: `[EasyLife Support ${ticketRef}] ${validation.data.subject}`,
    text: formattedBody,
    html: `<p><strong>Ticket Reference:</strong> ${escapeHtml(ticketRef)}</p><pre style="font-family:sans-serif;white-space:pre-wrap;">${escapeHtml(formattedBody)}</pre>`,
  });

  return {
    status: "success",
    message: `Thank you for contacting EasyLife. Your inquiry (Reference: ${ticketRef}) has been logged with our Nigerian operations desk (Port Harcourt, Lagos, and Abuja), and a support specialist will respond within one business day.`,
    values: {},
  };
}

export interface PasswordRecoveryState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function requestPasswordResetAction(
  _prevState: PasswordRecoveryState,
  formData: FormData
): Promise<PasswordRecoveryState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: "error",
      message: "Please enter a valid registered email address.",
    };
  }

  const clientIp = await getClientIp();
  const rateLimitResult = checkRateLimit(
    RATE_LIMIT_POLICIES.AUTH_ATTEMPT,
    `recover:${clientIp}:${email}`
  );
  if (!rateLimitResult.allowed) {
    return {
      status: "error",
      message: `Too many password reset requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.`,
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message: "Authentication service is not configured.",
    };
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://easylife-blue.vercel.app"
  ).replace(/\/+$/, "");

  const res = await supabaseFetch<unknown>(
    config,
    `/auth/v1/recover?redirect_to=${encodeURIComponent(`${appUrl}/forgot-password?mode=reset`)}`,
    {
      method: "POST",
      body: { email },
    }
  );

  if (!res.ok && res.status >= 500) {
    return {
      status: "error",
      message: "Unable to send password recovery email right now. Please try again.",
    };
  }

  return {
    status: "success",
    message:
      "If an account exists for that email address, a password reset link has been sent. Please check your inbox and spam folder.",
  };
}

export async function updatePasswordAction(
  _prevState: PasswordRecoveryState,
  formData: FormData
): Promise<PasswordRecoveryState> {
  const accessToken = String(formData.get("accessToken") || "").trim();
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!accessToken) {
    return {
      status: "error",
      message: "Recovery token is missing or expired. Please request a new password reset link.",
    };
  }

  if (newPassword.length < 8) {
    return {
      status: "error",
      message: "Your new password must be at least 8 characters long.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match. Please confirm your new password.",
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      status: "error",
      message: "Authentication service is not configured.",
    };
  }

  const res = await fetch(`${config.url}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
    cache: "no-store",
  });

  if (!res.ok) {
    let errMsg = "Could not update password. Your reset link may have expired.";
    try {
      const errJson = (await res.json()) as { message?: string; msg?: string };
      errMsg = errJson.message || errJson.msg || errMsg;
    } catch {
      // keep default
    }
    return {
      status: "error",
      message: errMsg,
    };
  }

  return {
    status: "success",
    message: "Your password has been updated successfully. You can now sign in with your new password.",
  };
}

export async function resendVerificationEmailAction(
  email: string
): Promise<{ ok: boolean; message: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, message: "Please enter a valid registered email address." };
  }

  const clientIp = await getClientIp();
  const rateLimitResult = checkRateLimit(
    RATE_LIMIT_POLICIES.AUTH_ATTEMPT,
    `resend_verify:${clientIp}:${trimmed}`
  );
  if (!rateLimitResult.allowed) {
    return {
      ok: false,
      message: `Too many resend attempts. Please wait ${rateLimitResult.retryAfterSeconds} seconds.`,
    };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { ok: false, message: "Authentication service is not configured." };
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://easylife-blue.vercel.app"
  ).replace(/\/+$/, "");

  try {
    const res = await fetch(`${config.url}/auth/v1/resend`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "signup",
        email: trimmed,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
        },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      let errMsg = "Could not resend verification email. Please verify the email address or try again later.";
      try {
        const errJson = (await res.json()) as { message?: string; msg?: string; error_description?: string };
        errMsg = errJson.error_description || errJson.message || errJson.msg || errMsg;
      } catch {
        // keep default
      }
      return { ok: false, message: errMsg };
    }

    return {
      ok: true,
      message: "A fresh verification link has been sent to your email. Please check your inbox and spam folder.",
    };
  } catch {
    return {
      ok: false,
      message: "An unexpected network error occurred while requesting verification email.",
    };
  }
}
