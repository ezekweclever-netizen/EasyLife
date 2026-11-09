/**
 * EasyLife Marketplace Risk & Compliance Engine
 * 
 * Implements deterministic rules-based indicators for:
 * 1. Duplicate accounts (shared phone numbers / emails)
 * 2. Repeated suspicious activity (high cancellation rate)
 * 3. Unusual booking patterns (rapid booking velocity)
 * 4. Repeated complaints (multiple disputes in short timeframe)
 * 5. Suspicious review activity (self-review attempts, identical reviews)
 * 
 * STRICT COMPLIANCE:
 * - Flags ONLY trigger administrative review (status = 'pending_review').
 * - NEVER automatically accuses or permanently suspends users.
 * - Administrators inspect evidence and make human determinations.
 */

import { supabaseAdminFetch } from "@/lib/supabase/admin";

export type RiskEntityType = "user" | "professional" | "booking" | "review";
export type RiskFlagType =
  | "duplicate_account"
  | "repeated_suspicious_activity"
  | "unusual_booking_pattern"
  | "repeated_complaints"
  | "suspicious_review_activity";

export type RiskSeverity = "low" | "medium" | "high";
export type RiskFlagStatus = "pending_review" | "investigating" | "dismissed" | "resolved";

export interface RiskFlagRecord {
  id: string;
  entity_type: RiskEntityType;
  entity_id: string;
  flag_type: RiskFlagType;
  severity: RiskSeverity;
  description: string;
  details: Record<string, any>;
  status: RiskFlagStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskFlagsFilter {
  status?: RiskFlagStatus;
  flag_type?: RiskFlagType;
  severity?: RiskSeverity;
  entity_type?: RiskEntityType;
  page?: number;
  limit?: number;
}

/**
 * Fetch Risk Flags with Filters and Pagination
 */
export async function fetchRiskFlags(filters: RiskFlagsFilter = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 25;
  const offset = (page - 1) * limit;

  let path = `/rest/v1/risk_flags?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;

  if (filters.status) {
    path += `&status=eq.${encodeURIComponent(filters.status)}`;
  }
  if (filters.flag_type) {
    path += `&flag_type=eq.${encodeURIComponent(filters.flag_type)}`;
  }
  if (filters.severity) {
    path += `&severity=eq.${encodeURIComponent(filters.severity)}`;
  }
  if (filters.entity_type) {
    path += `&entity_type=eq.${encodeURIComponent(filters.entity_type)}`;
  }

  const res = await supabaseAdminFetch<RiskFlagRecord[]>(path);
  const flags = res.ok && Array.isArray(res.data) ? res.data : [];

  return {
    flags,
    total: flags.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(flags.length / limit)),
  };
}

/**
 * Get Risk Flags Summary Metrics
 */
export async function getRiskFlagsSummary() {
  const res = await supabaseAdminFetch<Array<{ status: string; severity: string; flag_type: string }>>(
    "/rest/v1/risk_flags?select=status,severity,flag_type"
  );

  const data = res.ok && Array.isArray(res.data) ? res.data : [];

  const summary = {
    total: data.length,
    pending_review: 0,
    investigating: 0,
    dismissed: 0,
    resolved: 0,
    high_severity: 0,
    by_type: {} as Record<string, number>,
  };

  for (const row of data) {
    if (row.status === "pending_review") summary.pending_review++;
    if (row.status === "investigating") summary.investigating++;
    if (row.status === "dismissed") summary.dismissed++;
    if (row.status === "resolved") summary.resolved++;
    if (row.severity === "high") summary.high_severity++;

    summary.by_type[row.flag_type] = (summary.by_type[row.flag_type] || 0) + 1;
  }

  return summary;
}

/**
 * Run Account Risk Scan via PostgreSQL RPC
 */
export async function evaluateAccountRisk(userId: string) {
  const res = await supabaseAdminFetch<any>("/rest/v1/rpc/evaluate_account_risk_rules", {
    method: "POST",
    body: {
      p_user_id: userId,
    },
  });

  if (!res.ok) {
    throw new Error(res.message || "Failed to evaluate account risk.");
  }
  return res.data;
}

/**
 * Run Review Risk Scan via PostgreSQL RPC
 */
export async function evaluateReviewRisk(reviewId: string) {
  const res = await supabaseAdminFetch<any>("/rest/v1/rpc/evaluate_review_risk_rules", {
    method: "POST",
    body: {
      p_review_id: reviewId,
    },
  });

  if (!res.ok) {
    throw new Error(res.message || "Failed to evaluate review risk.");
  }
  return res.data;
}

/**
 * Admin Review Action: Update status and add documented notes
 */
export async function updateRiskFlagStatus(params: {
  flagId: string;
  status: RiskFlagStatus;
  adminNotes: string;
  adminId?: string;
}) {
  const res = await supabaseAdminFetch<RiskFlagRecord[]>(
    `/rest/v1/risk_flags?id=eq.${encodeURIComponent(params.flagId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: {
        status: params.status,
        admin_notes: params.adminNotes,
        reviewed_by: params.adminId || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    throw new Error(res.message || "Failed to update risk flag.");
  }
  if (!res.data || res.data.length === 0) {
    throw new Error("Failed to update risk flag: No data returned.");
  }

  return res.data[0]!;
}
