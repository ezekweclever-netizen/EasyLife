import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

export interface ServiceCategoryItem {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  default_commission_bps: number;
  is_active: boolean;
  display_order: number;
}

export interface PublicProfessionalItem {
  professional_id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  business_name: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  years_of_experience: number;
  verification_status: string;
  verified_at: string | null;
  base_callout_fee_kobo: number | null;
  currency_code: string;
  average_rating: number;
  review_count: number;
  completed_jobs_count: number;
  response_rate_pct: number;
  is_available: boolean;
  primary_city: string;
  primary_state: string;
  services?: Array<{
    id: string;
    service_title?: string | null;
    min_price_kobo: number;
    max_price_kobo: number | null;
    description: string | null;
    is_primary_skill: boolean;
    category?: { name: string; slug: string } | null;
  }>;
  service_areas?: Array<{
    id: string;
    city: string;
    state: string;
    lga_or_district: string;
    service_radius_km: number;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    professional_response: string | null;
    responded_at: string | null;
    created_at: string;
  }>;
}

export interface CustomerBookingItem {
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
  service_address: string;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  accepted_quotation_id: string | null;
  agreed_amount_kobo: number | null;
  currency_code: string;
  pro_marked_complete_at?: string | null;
  pro_completion_notes: string | null;
  customer_confirmed_at?: string | null;
  completed_at?: string | null;
  rework_notes?: string | null;
  rework_requested_at?: string | null;
  rework_count?: number;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    slug: string;
    icon_name: string | null;
  } | null;
  assigned_pro?: {
    business_name: string;
    display_name: string | null;
    avatar_url: string | null;
    verification_status: string;
  } | null;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_size_bytes: number;
    mime_type: string;
    storage_path: string;
    caption: string | null;
  }>;
  quotations?: Array<{
    id: string;
    reference_code: string;
    professional_id: string;
    status: string;
    version?: number;
    work_description?: string | null;
    labour_charges_kobo?: number;
    materials_costs_kobo?: number;
    additional_expenses_kobo?: number;
    subtotal_kobo: number;
    tax_kobo: number;
    total_amount_kobo: number;
    currency_code?: string;
    estimated_duration_minutes: number;
    proposed_start_at: string | null;
    valid_until: string | null;
    notes: string | null;
    decline_reason?: string | null;
    clarification_requested_at?: string | null;
    clarification_notes?: string | null;
    withdrawal_reason?: string | null;
    accepted_at: string | null;
    declined_at?: string | null;
    withdrawn_at?: string | null;
    created_at: string;
    quotation_items?: Array<{
      id: string;
      item_type: string;
      description: string;
      quantity: number;
      unit_price_kobo: number;
      line_total_kobo: number;
    }>;
    professional_profiles?: {
      id: string;
      business_name: string;
      headline: string | null;
      primary_city: string;
      verification_status: string;
      average_rating?: number;
      completed_jobs_count?: number;
    } | null;
  }>;
  appointments?: Array<{
    id: string;
    booking_id: string;
    quotation_id: string | null;
    professional_id: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    scheduled_start_at: string;
    scheduled_end_at: string;
    status: string;
    notes: string | null;
    confirmed_at: string;
  }>;
  status_history?: Array<{
    id: string;
    booking_id: string;
    from_status: string | null;
    to_status: string;
    reason: string | null;
    created_at: string;
  }>;
  review?: {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    photos?: string[];
    professional_response: string | null;
    responded_at: string | null;
    created_at: string;
  } | null;
  active_dispute?: {
    id: string;
    reference_code: string;
    category: string;
    description: string;
    disputed_amount_kobo: number;
    status: string;
    resolution_type?: string | null;
    resolution_summary?: string | null;
    created_at: string;
  } | null;
}

export interface CustomerNotificationItem {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CustomerProfileItem {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  primary_role: string;
  city: string;
  state: string;
  address_line: string | null;
  preferred_currency: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Fetch all active service categories from Supabase PostgREST.
 */
export async function getServiceCategories(): Promise<ServiceCategoryItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<ServiceCategoryItem[]>(
    config,
    "/rest/v1/service_categories?is_active=eq.true&order=display_order.asc&select=*"
  );

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch recommended / discoverable professionals from Supabase view.
 */
export async function getDiscoverableProfessionals(params: {
  city?: string;
  categoryId?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  limit?: number;
} = {}): Promise<PublicProfessionalItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const queryParts: string[] = ["select=*"];

  if (params.city && params.city !== "All Cities") {
    queryParts.push(`primary_city=ilike.*${encodeURIComponent(params.city)}*`);
  }

  if (params.verifiedOnly) {
    queryParts.push("verification_status=eq.approved");
  }

  if (params.minRating && params.minRating > 0) {
    queryParts.push(`average_rating=gte.${params.minRating}`);
  }

  const limit = params.limit ?? 20;
  queryParts.push(`limit=${limit}`);
  queryParts.push("order=completed_jobs_count.desc,average_rating.desc");

  const path = `/rest/v1/public_professional_directory?${queryParts.join("&")}`;
  const res = await supabaseFetch<PublicProfessionalItem[]>(config, path);

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch single professional by id or slug.
 */
export async function getProfessionalById(
  idOrSlug: string
): Promise<PublicProfessionalItem | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const filter = isUuid
    ? `professional_id=eq.${idOrSlug}`
    : `slug=eq.${encodeURIComponent(idOrSlug)}`;

  const res = await supabaseFetch<PublicProfessionalItem[]>(
    config,
    `/rest/v1/public_professional_directory?${filter}&limit=1&select=*`
  );

  if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]) {
    const pro = res.data[0];

    const [servicesRes, areasRes, reviewsRes] = await Promise.all([
      supabaseFetch<any[]>(
        config,
        `/rest/v1/professional_services?professional_id=eq.${pro.professional_id}&is_active=eq.true&select=id,service_title,min_price_kobo,max_price_kobo,description,is_primary_skill,service_categories(name,slug)`
      ),
      supabaseFetch<any[]>(
        config,
        `/rest/v1/professional_service_areas?professional_id=eq.${pro.professional_id}&is_active=eq.true&select=id,city,state,lga_or_district,service_radius_km`
      ),
      supabaseFetch<any[]>(
        config,
        `/rest/v1/reviews?professional_id=eq.${pro.professional_id}&is_published=eq.true&moderation_status=eq.approved&select=id,rating,title,comment,professional_response,responded_at,created_at&order=created_at.desc&limit=10`
      ),
    ]);

    pro.services =
      servicesRes.ok && Array.isArray(servicesRes.data)
        ? servicesRes.data.map((s) => ({
            ...s,
            category: s.service_categories || null,
          }))
        : [];
    pro.service_areas =
      areasRes.ok && Array.isArray(areasRes.data) ? areasRes.data : [];
    pro.reviews =
      reviewsRes.ok && Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

    return pro;
  }
  return null;
}

/**
 * Fetch customer bookings for the authenticated user.
 */
export async function getCustomerBookings(
  userId: string,
  accessToken: string,
  statusFilter?: "active" | "completed" | "cancelled" | "all"
): Promise<CustomerBookingItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const queryParts = [
    `customer_id=eq.${userId}`,
    "select=*,service_categories(name,slug,icon_name)",
    "order=created_at.desc",
  ];

  if (statusFilter === "active") {
    queryParts.push("status=in.(open,matched,quoted,accepted,scheduled,in_progress,pro_marked_complete)");
  } else if (statusFilter === "completed") {
    queryParts.push("status=eq.completed");
  } else if (statusFilter === "cancelled") {
    queryParts.push("status=eq.cancelled");
  }

  const path = `/rest/v1/bookings?${queryParts.join("&")}`;
  const res = await supabaseFetch<any[]>(config, path, { accessToken });

  if (!res.ok || !Array.isArray(res.data)) return [];

  return res.data.map((row) => ({
    ...row,
    category: row.service_categories
      ? {
          name: row.service_categories.name,
          slug: row.service_categories.slug,
          icon_name: row.service_categories.icon_name,
        }
      : null,
  }));
}

/**
 * Fetch a single booking by ID with full details, attachments, quotations, appointments & history.
 */
export async function getCustomerBookingById(
  bookingId: string,
  userId: string,
  accessToken: string
): Promise<CustomerBookingItem | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const [bookingRes, quotesRes, appointmentsRes, historyRes, reviewRes, disputeRes] = await Promise.all([
    supabaseFetch<any[]>(
      config,
      `/rest/v1/bookings?id=eq.${bookingId}&customer_id=eq.${userId}&select=*,service_categories(name,slug,icon_name),booking_attachments(*),professional_profiles(id,business_name,headline,verification_status)&limit=1`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/quotations?booking_id=eq.${bookingId}&select=*,quotation_items(*),professional_profiles(id,business_name,headline,primary_city,verification_status)&order=created_at.desc`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/appointments?booking_id=eq.${bookingId}&order=scheduled_start_at.desc`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/booking_status_history?booking_id=eq.${bookingId}&order=created_at.asc`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/reviews?booking_id=eq.${bookingId}&limit=1&select=*`,
      { accessToken }
    ),
    supabaseFetch<any[]>(
      config,
      `/rest/v1/disputes?booking_id=eq.${bookingId}&order=created_at.desc&limit=1&select=*`,
      { accessToken }
    ),
  ]);

  if (!bookingRes.ok || !Array.isArray(bookingRes.data) || bookingRes.data.length === 0) {
    return null;
  }

  const row = bookingRes.data[0];
  const review = reviewRes.ok && Array.isArray(reviewRes.data) && reviewRes.data.length > 0 ? reviewRes.data[0] : null;
  const dispute = disputeRes.ok && Array.isArray(disputeRes.data) && disputeRes.data.length > 0 ? disputeRes.data[0] : null;

  return {
    ...row,
    category: row.service_categories
      ? {
          name: row.service_categories.name,
          slug: row.service_categories.slug,
          icon_name: row.service_categories.icon_name,
        }
      : null,
    assigned_pro: row.professional_profiles
      ? {
          business_name: row.professional_profiles.business_name,
          display_name: row.professional_profiles.headline,
          avatar_url: null,
          verification_status: row.professional_profiles.verification_status,
        }
      : null,
    attachments: Array.isArray(row.booking_attachments) ? row.booking_attachments : [],
    quotations: quotesRes.ok && Array.isArray(quotesRes.data) ? quotesRes.data : [],
    appointments: appointmentsRes.ok && Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [],
    status_history: historyRes.ok && Array.isArray(historyRes.data) ? historyRes.data : [],
    review,
    active_dispute: dispute,
  };
}

/**
 * Fetch customer notifications from Supabase.
 */
export async function getCustomerNotifications(
  userId: string,
  accessToken: string
): Promise<CustomerNotificationItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const path = `/rest/v1/notifications?user_id=eq.${userId}&order=created_at.desc&limit=10&select=*`;
  const res = await supabaseFetch<CustomerNotificationItem[]>(config, path, { accessToken });

  return res.ok && Array.isArray(res.data) ? res.data : [];
}

/**
 * Fetch customer profile.
 */
export async function getCustomerProfile(
  userId: string,
  accessToken: string
): Promise<CustomerProfileItem | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const path = `/rest/v1/profiles?id=eq.${userId}&limit=1&select=*`;
  const res = await supabaseFetch<CustomerProfileItem[]>(config, path, { accessToken });

  if (res.ok && Array.isArray(res.data) && res.data.length > 0 && res.data[0]) {
    return res.data[0];
  }
  return null;
}
