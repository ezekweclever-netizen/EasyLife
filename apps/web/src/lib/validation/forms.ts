/**
 * Dependency-free validation for EasyLife public forms (login, registration,
 * contact). Server Actions treat these results as authoritative; client
 * components reuse the same rules for inline guidance.
 *
 * NOTE: No imports — unit-tested directly via Node TypeScript type stripping.
 * Constraints mirror the PostgreSQL CHECK constraints in supabase/migrations.
 */

export const PILOT_CITIES = ["Port Harcourt", "Lagos", "Abuja"] as const;
export type PilotCity = (typeof PILOT_CITIES)[number];

export const PILOT_CITY_STATE: Readonly<Record<PilotCity, string>> = {
  "Port Harcourt": "Rivers State",
  Lagos: "Lagos State",
  Abuja: "FCT",
};

/** 'admin' and 'moderator' are intentionally excluded — administrative staff are provisioned server-side only. */
export const SELF_REGISTRABLE_ROLES = [
  "customer",
  "professional",
  "business",
  "property_manager",
  "employer",
] as const;
export type SelfRegistrableRole = (typeof SELF_REGISTRABLE_ROLES)[number];

export const ROLE_OPTIONS: ReadonlyArray<{
  value: SelfRegistrableRole;
  label: string;
  description: string;
}> = [
  {
    value: "customer",
    label: "Customer",
    description: "Find verified professionals for home and everyday services.",
  },
  {
    value: "professional",
    label: "Service Professional",
    description: "Get verified, receive requests and send itemised quotations.",
  },
  {
    value: "business",
    label: "Business",
    description: "Manage facilities, equipment and maintenance for your company.",
  },
  {
    value: "property_manager",
    label: "Landlord / Property Manager",
    description: "Track properties, assets and maintenance schedules.",
  },
  {
    value: "employer",
    label: "Employer / Recruiter",
    description: "Post job vacancies, discover talent and hire skilled workers.",
  },
];

export const CONTACT_INQUIRY_TYPES = [
  "customer_support",
  "professional_onboarding",
  "business_solutions",
  "partnership",
  "privacy_request",
  "other",
] as const;
export type ContactInquiryType = (typeof CONTACT_INQUIRY_TYPES)[number];

export const CONTACT_INQUIRY_LABELS: Readonly<Record<ContactInquiryType, string>> = {
  customer_support: "Customer support",
  professional_onboarding: "Professional onboarding & verification",
  business_solutions: "Business & property maintenance",
  partnership: "Partnerships",
  privacy_request: "Privacy or data protection request",
  other: "Something else",
};

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export interface FormActionState<K extends string> {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors<K>;
  values?: Partial<Record<K, string>>;
}

export type ValidationResult<T, K extends string> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors<K> };

type RawInput = Record<string, unknown>;

function readText(raw: RawInput, key: string, trim = true): string {
  const value = raw[key];
  if (typeof value !== "string") return "";
  return trim ? value.trim() : value;
}

function isOneOf<T extends string>(value: string, list: readonly T[]): value is T {
  return (list as readonly string[]).includes(value);
}

function hasErrors<K extends string>(errors: FieldErrors<K>): boolean {
  return Object.keys(errors).length > 0;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

/**
 * Accepts 0803..., 234803..., +234803... (with spaces/dashes) and returns
 * E.164 (+234XXXXXXXXXX), or null if not a valid Nigerian mobile number.
 */
export function normaliseNigerianPhone(raw: string): string | null {
  const compact = raw.replace(/[\s()-]/g, "");
  const match = compact.match(/^(?:\+?234|0)([789][01]\d{8})$/);
  const subscriber = match?.[1];
  return subscriber ? `+234${subscriber}` : null;
}

export function getPasswordIssue(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 72) return "Use 72 characters or fewer.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Include at least one letter and one number.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginField = "email" | "password";

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLogin(raw: RawInput): ValidationResult<LoginInput, LoginField> {
  const email = normaliseEmail(readText(raw, "email"));
  const password = readText(raw, "password", false);
  const errors: FieldErrors<LoginField> = {};

  if (!email) errors.email = "Enter your email address.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Enter your password.";
  else if (password.length > 72) errors.password = "Password is too long.";

  return hasErrors(errors)
    ? { ok: false, fieldErrors: errors }
    : { ok: true, data: { email, password } };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export type RegisterField =
  | "fullName"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "role"
  | "city"
  | "acceptTerms";

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string | null;
  password: string;
  role: SelfRegistrableRole;
  city: PilotCity;
  state: string;
}

export function validateRegistration(
  raw: RawInput
): ValidationResult<RegisterInput, RegisterField> {
  const fullName = readText(raw, "fullName").replace(/\s+/g, " ");
  const email = normaliseEmail(readText(raw, "email"));
  const phoneRaw = readText(raw, "phone");
  const password = readText(raw, "password", false);
  const confirmPassword = readText(raw, "confirmPassword", false);
  const role = readText(raw, "role");
  const city = readText(raw, "city");
  const acceptTerms = readText(raw, "acceptTerms");
  const errors: FieldErrors<RegisterField> = {};

  if (fullName.length < 2) errors.fullName = "Enter your full name.";
  else if (fullName.length > 100) errors.fullName = "Use 100 characters or fewer.";
  else if (!/[A-Za-zÀ-ÿ]/.test(fullName)) errors.fullName = "Enter a valid name.";

  if (!email) errors.email = "Enter your email address.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  let phone: string | null = null;
  if (phoneRaw) {
    phone = normaliseNigerianPhone(phoneRaw);
    if (!phone) errors.phone = "Enter a valid Nigerian mobile number, e.g. 0803 000 0000.";
  }

  const passwordIssue = getPasswordIssue(password);
  if (!password) errors.password = "Create a password.";
  else if (passwordIssue) errors.password = passwordIssue;

  if (!confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";

  if (!isOneOf(role, SELF_REGISTRABLE_ROLES)) errors.role = "Choose an account type.";
  if (!isOneOf(city, PILOT_CITIES)) errors.city = "Choose your city.";

  if (acceptTerms !== "on" && acceptTerms !== "true") {
    errors.acceptTerms = "You must accept the Terms of Service and Privacy Policy.";
  }

  if (hasErrors(errors) || !isOneOf(role, SELF_REGISTRABLE_ROLES) || !isOneOf(city, PILOT_CITIES)) {
    return { ok: false, fieldErrors: errors };
  }

  return {
    ok: true,
    data: { fullName, email, phone, password, role, city, state: PILOT_CITY_STATE[city] },
  };
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export type ContactField =
  | "fullName"
  | "email"
  | "phone"
  | "inquiryType"
  | "city"
  | "subject"
  | "message";

export interface ContactInput {
  fullName: string;
  email: string;
  phone: string | null;
  inquiryType: ContactInquiryType;
  city: PilotCity | null;
  subject: string;
  message: string;
}

export function validateContact(raw: RawInput): ValidationResult<ContactInput, ContactField> {
  const fullName = readText(raw, "fullName").replace(/\s+/g, " ");
  const email = normaliseEmail(readText(raw, "email"));
  const phoneRaw = readText(raw, "phone");
  const inquiryType = readText(raw, "inquiryType");
  const cityRaw = readText(raw, "city");
  const subject = readText(raw, "subject").replace(/\s+/g, " ");
  const message = readText(raw, "message");
  const errors: FieldErrors<ContactField> = {};

  if (fullName.length < 2) errors.fullName = "Enter your name.";
  else if (fullName.length > 120) errors.fullName = "Use 120 characters or fewer.";

  if (!email) errors.email = "Enter your email address.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  let phone: string | null = null;
  if (phoneRaw) {
    phone = normaliseNigerianPhone(phoneRaw);
    if (!phone) errors.phone = "Enter a valid Nigerian mobile number or leave blank.";
  }

  if (!isOneOf(inquiryType, CONTACT_INQUIRY_TYPES)) errors.inquiryType = "Choose a topic.";

  let city: PilotCity | null = null;
  if (cityRaw) {
    if (isOneOf(cityRaw, PILOT_CITIES)) city = cityRaw;
    else errors.city = "Choose a listed city or leave blank.";
  }

  if (subject.length < 3) errors.subject = "Enter a short subject (at least 3 characters).";
  else if (subject.length > 150) errors.subject = "Use 150 characters or fewer.";

  if (message.length < 20) errors.message = "Please give a little more detail (at least 20 characters).";
  else if (message.length > 4000) errors.message = "Use 4,000 characters or fewer.";

  if (hasErrors(errors) || !isOneOf(inquiryType, CONTACT_INQUIRY_TYPES)) {
    return { ok: false, fieldErrors: errors };
  }

  return { ok: true, data: { fullName, email, phone, inquiryType, city, subject, message } };
}
