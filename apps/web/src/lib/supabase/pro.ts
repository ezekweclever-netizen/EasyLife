import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { ServiceCategoryItem } from "@/lib/supabase/customer";

export type ProfessionalVerificationStatus =
  | "unsubmitted"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type DocumentType =
  | "national_id_nin"
  | "voters_card"
  | "drivers_license"
  | "international_passport"
  | "trade_certificate"
  | "cac_certificate"
  | "utility_bill"
  | "other";

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  years_of_experience: number;
  verification_status: ProfessionalVerificationStatus;
  submitted_for_verification_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  base_callout_fee_kobo: number;
  currency_code: string;
  average_rating: number;
  review_count: number;
  completed_jobs_count: number;
  response_rate_pct: number;
  is_available: boolean;
  primary_city: string;
  primary_state: string;
  created_at: string;
  updated_at: string;
  // Associated data
  full_name?: string;
  email?: string;
  phone?: string | null;
  avatar_url?: string | null;
  services?: ProfessionalServiceItem[];
  service_areas?: ProfessionalAreaItem[];
  availability?: ProfessionalAvailabilityItem[];
  documents?: ProfessionalDocumentItem[];
}

export interface ProfessionalServiceItem {
  id: string;
  professional_id: string;
  category_id: string;
  service_title?: string | null;
  min_price_kobo: number;
  max_price_kobo: number | null;
  currency_code: string;
  description: string | null;
  is_primary_skill: boolean;
  is_active: boolean;
  category?: ServiceCategoryItem;
}

export interface ProfessionalAreaItem {
  id: string;
  professional_id: string;
  city: string;
  state: string;
  lga_or_district: string;
  service_radius_km: number;
  is_primary: boolean;
  is_active: boolean;
}

export interface ProfessionalAvailabilityItem {
  id: string;
  professional_id: string;
  day_of_week: number | null; // 0=Sunday .. 6=Saturday
  specific_date: string | null;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
}

export interface ProfessionalDocumentItem {
  id: string;
  professional_id: string;
  document_type: DocumentType;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  document_number_masked: string | null;
  verification_status: "pending" | "approved" | "verified" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ProQuotationItem {
  id: string;
  quotation_id: string;
  item_type: "labor" | "parts" | "callout" | "transport" | "other";
  description: string;
  quantity: number;
  unit_price_kobo: number;
  line_total_kobo: number;
  currency_code: string;
  sort_order: number;
}

export interface ProQuotation {
  id: string;
  reference_code: string;
  booking_id: string;
  professional_id: string;
  status: "draft" | "pending" | "accepted" | "declined" | "withdrawn" | "expired";
  version: number;
  work_description: string | null;
  labour_charges_kobo: number;
  materials_costs_kobo: number;
  additional_expenses_kobo: number;
  subtotal_kobo: number;
  tax_kobo: number;
  total_amount_kobo: number;
  currency_code: string;
  estimated_duration_minutes: number;
  proposed_start_at: string | null;
  valid_until: string | null;
  notes: string | null;
  decline_reason: string | null;
  clarification_requested_at: string | null;
  clarification_notes: string | null;
  clarification_responded_at: string | null;
  clarification_response: string | null;
  withdrawal_reason: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  items?: ProQuotationItem[];
  booking?: {
    id: string;
    reference_code: string;
    title: string;
    city: string;
    lga_or_district: string | null;
    status: string;
  };
}

export interface ProJobRequestItem {
  id: string;
  reference_code: string;
  customer_id: string;
  professional_id: string | null;
  category_id: string;
  title: string;
  description: string;
  urgency: string;
  status: string;
  city: string;
  state: string;
  lga_or_district: string | null;
  service_address: string; // May be masked for open requests
  preferred_date: string | null;
  preferred_time_slot: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  accepted_quotation_id: string | null;
  agreed_amount_kobo: number | null;
  currency_code: string;
  pro_completion_notes: string | null;
  created_at: string;
  category?: {
    name: string;
    slug: string;
    icon_name: string | null;
  } | null;
  customer_display_name?: string;
  customer_phone_masked?: string;
  is_assigned_to_pro?: boolean;
}

export interface ProEarningsSummary {
  wallet_balance_kobo: number;
  in_escrow_kobo: number;
  total_earned_kobo: number;
  total_platform_fees_kobo: number;
  completed_jobs_count: number;
  pending_quotations_count: number;
  transactions: Array<{
    id: string;
    date: string;
    booking_reference: string;
    title: string;
    customer_location: string;
    gross_kobo: number;
    platform_fee_kobo: number;
    net_kobo: number;
    status: "paid_to_wallet" | "in_escrow" | "pending_customer_signoff";
  }>;
}

/**
 * Fetch professional profile for the authenticated user ID.
 */
export async function getProfessionalProfile(
  userId: string,
  accessToken: string
): Promise<ProfessionalProfile | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  // 1. Fetch pro profile
  const proRes = await supabaseFetch<ProfessionalProfile[]>(
    config,
    `/rest/v1/professional_profiles?user_id=eq.${userId}&limit=1&select=*`,
    { accessToken }
  );

  if (!proRes.ok || !Array.isArray(proRes.data) || proRes.data.length === 0 || !proRes.data[0]) {
    return null;
  }

  const profile = proRes.data[0];

  // 2. Fetch user profile information (name, avatar, phone, email)
  const userRes = await supabaseFetch<any[]>(
    config,
    `/rest/v1/profiles?id=eq.${userId}&limit=1&select=full_name,email,phone,avatar_url`,
    { accessToken }
  );
  if (userRes.ok && Array.isArray(userRes.data) && userRes.data[0]) {
    profile.full_name = userRes.data[0].full_name;
    profile.email = userRes.data[0].email;
    profile.phone = userRes.data[0].phone;
    profile.avatar_url = userRes.data[0].avatar_url;
  }

  // 3. Fetch services with category joined
  const servicesRes = await supabaseFetch<any[]>(
    config,
    `/rest/v1/professional_services?professional_id=eq.${profile.id}&select=*,service_categories(*)`,
    { accessToken }
  );
  if (servicesRes.ok && Array.isArray(servicesRes.data)) {
    profile.services = servicesRes.data.map((s) => ({
      ...s,
      category: s.service_categories,
    }));
  }

  // 4. Fetch service areas
  const areasRes = await supabaseFetch<ProfessionalAreaItem[]>(
    config,
    `/rest/v1/professional_service_areas?professional_id=eq.${profile.id}&select=*`,
    { accessToken }
  );
  if (areasRes.ok && Array.isArray(areasRes.data)) {
    profile.service_areas = areasRes.data;
  }

  // 5. Fetch availability
  const availRes = await supabaseFetch<ProfessionalAvailabilityItem[]>(
    config,
    `/rest/v1/professional_availability?professional_id=eq.${profile.id}&order=day_of_week.asc,start_time.asc&select=*`,
    { accessToken }
  );
  if (availRes.ok && Array.isArray(availRes.data)) {
    profile.availability = availRes.data;
  }

  // 6. Fetch verification documents
  const docsRes = await supabaseFetch<ProfessionalDocumentItem[]>(
    config,
    `/rest/v1/professional_documents?professional_id=eq.${profile.id}&order=created_at.desc&select=*`,
    { accessToken }
  );
  if (docsRes.ok && Array.isArray(docsRes.data)) {
    profile.documents = docsRes.data;
  }

  return profile;
}

/**
 * Fetch documents for a professional.
 */
export async function getProfessionalDocuments(
  proId: string,
  accessToken: string
): Promise<ProfessionalDocumentItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<ProfessionalDocumentItem[]>(
    config,
    `/rest/v1/professional_documents?professional_id=eq.${proId}&order=created_at.desc&select=*`,
    { accessToken }
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch eligible open service requests for professionals to browse and quote on.
 *
 * PRIVACY PROTECTION RULE:
 * For unassigned open requests, customer private information (exact street number,
 * exact building, customer phone, customer full name) is NEVER exposed.
 */
export async function getEligibleJobRequests(
  params: {
    city?: string;
    categoryId?: string;
    proId?: string;
    statusFilter?: "open" | "active" | "completed" | "all";
  },
  accessToken: string
): Promise<ProJobRequestItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const queryParts = [
    "select=*,service_categories(name,slug,icon_name)",
    "order=created_at.desc",
  ];

  if (params.statusFilter === "open" || !params.statusFilter) {
    queryParts.push("status=in.(submitted,open,pending_pro_response,quoted)");
  } else if (params.statusFilter === "active") {
    queryParts.push("status=in.(accepted,confirmed,scheduled,in_progress,pro_marked_complete)");
  } else if (params.statusFilter === "completed") {
    queryParts.push("status=eq.completed");
  }

  if (params.city && params.city !== "All Cities") {
    queryParts.push(`city=ilike.*${encodeURIComponent(params.city)}*`);
  }

  if (params.categoryId && params.categoryId !== "all") {
    queryParts.push(`category_id=eq.${params.categoryId}`);
  }

  const path = `/rest/v1/bookings?${queryParts.join("&")}&limit=30`;
  const res = await supabaseFetch<any[]>(config, path, { accessToken });

  if (!res.ok || !Array.isArray(res.data)) return [];

  return res.data.map((row) => {
    const isAssigned = Boolean(params.proId && row.professional_id === params.proId);
    const isAcceptedOrBeyond = [
      "accepted",
      "confirmed",
      "scheduled",
      "in_progress",
      "pro_marked_complete",
      "completed",
    ].includes(row.status);

    // If job is assigned to this pro and accepted, reveal full address; otherwise MASK for privacy
    let serviceAddress = row.service_address;
    let customerDisplayName = "Customer";
    let customerPhoneMasked = "Protected until quote accepted";

    if (!isAssigned || !isAcceptedOrBeyond) {
      const district = row.lga_or_district ? `${row.lga_or_district}, ` : "";
      serviceAddress = `[Street address protected until quotation accepted] • ${district}${row.city}`;
      customerDisplayName = `Verified Customer in ${district}${row.city}`;
      customerPhoneMasked = "•••• ••• ••••";
    }

    return {
      ...row,
      service_address: serviceAddress,
      customer_display_name: customerDisplayName,
      customer_phone_masked: customerPhoneMasked,
      is_assigned_to_pro: isAssigned,
      category: row.service_categories
        ? {
            name: row.service_categories.name,
            slug: row.service_categories.slug,
            icon_name: row.service_categories.icon_name,
          }
        : null,
    };
  });
}

/**
 * Fetch a single booking request by ID for a professional, enforcing privacy masking.
 */
export async function getProJobById(
  bookingId: string,
  proId: string | undefined,
  accessToken: string
): Promise<ProJobRequestItem | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const path = `/rest/v1/bookings?id=eq.${bookingId}&select=*,service_categories(name,slug,icon_name)&limit=1`;
  const res = await supabaseFetch<any[]>(config, path, { accessToken });

  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0 || !res.data[0]) {
    return null;
  }

  const row = res.data[0];
  const isAssigned = Boolean(proId && row.professional_id === proId);
  const isAcceptedOrBeyond = [
    "accepted",
    "confirmed",
    "scheduled",
    "in_progress",
    "pro_marked_complete",
    "completed",
  ].includes(row.status);

  let serviceAddress = row.service_address;
  let customerDisplayName = "Customer";
  let customerPhoneMasked = "Protected until quote accepted";

  if (!isAssigned || !isAcceptedOrBeyond) {
    const district = row.lga_or_district ? `${row.lga_or_district}, ` : "";
    serviceAddress = `[Street address protected until quotation accepted] • ${district}${row.city}`;
    customerDisplayName = `Verified Customer in ${district}${row.city}`;
    customerPhoneMasked = "•••• ••• ••••";
  }

  return {
    ...row,
    service_address: serviceAddress,
    customer_display_name: customerDisplayName,
    customer_phone_masked: customerPhoneMasked,
    is_assigned_to_pro: isAssigned,
    category: row.service_categories
      ? {
          name: row.service_categories.name,
          slug: row.service_categories.slug,
          icon_name: row.service_categories.icon_name,
        }
      : null,
  };
}

/**
 * Fetch quotations created by a professional.
 */
export async function getProQuotations(
  proId: string,
  accessToken: string
): Promise<ProQuotation[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const path = `/rest/v1/quotations?professional_id=eq.${proId}&select=*,quotation_items(*),bookings(id,reference_code,title,city,lga_or_district,status)&order=created_at.desc`;
  const res = await supabaseFetch<any[]>(config, path, { accessToken });

  if (!res.ok || !Array.isArray(res.data)) return [];

  return res.data.map((q) => ({
    ...q,
    items: Array.isArray(q.quotation_items) ? q.quotation_items : [],
    booking: q.bookings || null,
  }));
}

/**
 * Fetch professional earnings summary and ledger.
 */
export async function getProEarningsSummary(
  proId: string,
  accessToken: string
): Promise<ProEarningsSummary> {
  const config = getSupabasePublicConfig();
  if (!config) {
    return {
      wallet_balance_kobo: 0,
      in_escrow_kobo: 0,
      total_earned_kobo: 0,
      total_platform_fees_kobo: 0,
      completed_jobs_count: 0,
      pending_quotations_count: 0,
      transactions: [],
    };
  }

  // Fetch all bookings assigned to this pro
  const res = await supabaseFetch<any[]>(
    config,
    `/rest/v1/bookings?professional_id=eq.${proId}&select=id,reference_code,title,city,lga_or_district,status,agreed_amount_kobo,created_at&order=created_at.desc`,
    { accessToken }
  );

  const bookings = res.ok && Array.isArray(res.data) ? res.data : [];

  let completedJobsCount = 0;
  let totalEarnedKobo = 0;
  let totalPlatformFeesKobo = 0;
  let inEscrowKobo = 0;

  const transactions: ProEarningsSummary["transactions"] = [];

  for (const b of bookings) {
    const gross = Number(b.agreed_amount_kobo || 0);
    if (!gross) continue;

    // Platform fee standard is 10% (1000 bps)
    const fee = Math.round(gross * 0.1);
    const net = gross - fee;

    if (b.status === "completed") {
      completedJobsCount++;
      totalEarnedKobo += net;
      totalPlatformFeesKobo += fee;
      transactions.push({
        id: b.id,
        date: b.created_at,
        booking_reference: b.reference_code,
        title: b.title,
        customer_location: `${b.lga_or_district ? b.lga_or_district + ", " : ""}${b.city}`,
        gross_kobo: gross,
        platform_fee_kobo: fee,
        net_kobo: net,
        status: "paid_to_wallet",
      });
    } else if (["accepted", "confirmed", "scheduled", "in_progress"].includes(b.status)) {
      inEscrowKobo += net;
      transactions.push({
        id: b.id,
        date: b.created_at,
        booking_reference: b.reference_code,
        title: b.title,
        customer_location: `${b.lga_or_district ? b.lga_or_district + ", " : ""}${b.city}`,
        gross_kobo: gross,
        platform_fee_kobo: fee,
        net_kobo: net,
        status: "in_escrow",
      });
    } else if (b.status === "pro_marked_complete") {
      inEscrowKobo += net;
      transactions.push({
        id: b.id,
        date: b.created_at,
        booking_reference: b.reference_code,
        title: b.title,
        customer_location: `${b.lga_or_district ? b.lga_or_district + ", " : ""}${b.city}`,
        gross_kobo: gross,
        platform_fee_kobo: fee,
        net_kobo: net,
        status: "pending_customer_signoff",
      });
    }
  }

  // Available balance is completed net earnings
  const walletBalanceKobo = totalEarnedKobo;

  return {
    wallet_balance_kobo: walletBalanceKobo,
    in_escrow_kobo: inEscrowKobo,
    total_earned_kobo: totalEarnedKobo,
    total_platform_fees_kobo: totalPlatformFeesKobo,
    completed_jobs_count: completedJobsCount,
    pending_quotations_count: 0,
    transactions,
  };
}

/**
 * Profile completion calculation helper.
 */
export function calculateProfileCompletion(profile: ProfessionalProfile | null): {
  percentage: number;
  steps: Array<{ name: string; completed: boolean; hint: string }>;
} {
  if (!profile) {
    return {
      percentage: 0,
      steps: [
        { name: "Basic Details", completed: false, hint: "Add business name and bio" },
        { name: "Service Categories", completed: false, hint: "Select your trades" },
        { name: "Operating Areas", completed: false, hint: "Specify cities and districts" },
        { name: "Working Hours", completed: false, hint: "Set availability schedule" },
        { name: "Identity & Trade Documents", completed: false, hint: "Upload NIN and certificates" },
      ],
    };
  }

  const hasBasic = Boolean(profile.business_name && profile.bio && profile.years_of_experience > 0);
  const hasServices = Boolean(profile.services && profile.services.length > 0);
  const hasAreas = Boolean(profile.service_areas && profile.service_areas.length > 0);
  const hasAvailability = Boolean(profile.availability && profile.availability.length > 0);
  const hasDocs = Boolean(profile.documents && profile.documents.length > 0);

  const steps = [
    { name: "Basic Business Info", completed: hasBasic, hint: "Business name, bio & experience" },
    { name: "Trade Specialties", completed: hasServices, hint: "Add at least 1 service category" },
    { name: "Service Areas", completed: hasAreas, hint: "Add at least 1 service location" },
    { name: "Working Hours", completed: hasAvailability, hint: "Configure weekly hours" },
    { name: "Verification Documents", completed: hasDocs, hint: "Upload government ID or trade certification" },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  return { percentage, steps };
}
