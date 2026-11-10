"use server";

import {
  fetchRiskFlags,
  getRiskFlagsSummary,
  updateRiskFlagStatus,
  evaluateAccountRisk,
  evaluateReviewRisk,
  RiskFlagStatus,
  RiskFlagType,
  RiskSeverity,
  RiskEntityType,
} from "@/lib/risk/risk-engine";
import { verifyAdminSession } from "@/lib/auth/admin-guard";

export async function fetchAdminRiskFlagsAction(params: {
  status?: RiskFlagStatus;
  flag_type?: RiskFlagType;
  severity?: RiskSeverity;
  entity_type?: RiskEntityType;
  page?: number;
  limit?: number;
}) {
  try {
    const adminCheck = await verifyAdminSession();
    if (!adminCheck.ok) {
      return { success: false, error: "Unauthorized: Administrator privileges required." };
    }

    const data = await fetchRiskFlags(params);
    const summary = await getRiskFlagsSummary();
    return { success: true, data, summary };
  } catch (err: any) {
    console.error("fetchAdminRiskFlagsAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function adminReviewRiskFlagAction(params: {
  flagId: string;
  status: RiskFlagStatus;
  adminNotes: string;
}) {
  try {
    const adminCheck = await verifyAdminSession();
    if (!adminCheck.ok) {
      return { success: false, error: "Unauthorized: Administrator privileges required." };
    }

    if (!params.adminNotes || !params.adminNotes.trim()) {
      return { success: false, error: "Administrative notes are required for this action." };
    }

    const updated = await updateRiskFlagStatus({
      flagId: params.flagId,
      status: params.status,
      adminNotes: params.adminNotes.trim(),
      adminId: adminCheck.user.id,
    });

    return { success: true, data: updated };
  } catch (err: any) {
    console.error("adminReviewRiskFlagAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function triggerAccountRiskAuditAction(userId: string) {
  try {
    const adminCheck = await verifyAdminSession();
    if (!adminCheck.ok) {
      return { success: false, error: "Unauthorized: Administrator privileges required." };
    }

    const res = await evaluateAccountRisk(userId);
    return { success: true, result: res };
  } catch (err: any) {
    console.error("triggerAccountRiskAuditAction error:", err);
    return { success: false, error: err.message };
  }
}

export async function triggerReviewRiskAuditAction(reviewId: string) {
  try {
    const adminCheck = await verifyAdminSession();
    if (!adminCheck.ok) {
      return { success: false, error: "Unauthorized: Administrator privileges required." };
    }

    const res = await evaluateReviewRisk(reviewId);
    return { success: true, result: res };
  } catch (err: any) {
    console.error("triggerReviewRiskAuditAction error:", err);
    return { success: false, error: err.message };
  }
}
