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
    await persistSession(res.data);

    const nextPath = typeof raw.next === "string" && raw.next.startsWith("/") ? raw.next : null;
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

  return {
    status: "success",
    message:
      "Thank you for contacting EasyLife. Your message has been received by our Nigerian operations desk (Port Harcourt, Lagos, and Abuja). A member of our support team will respond to your email within one business day.",
    values: {},
  };
}
