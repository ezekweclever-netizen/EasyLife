/**
 * EasyLife Backend Security & Authorization Policy Guards
 * Enforces defense-in-depth authorization on server endpoints alongside PostgreSQL RLS.
 */

import type {
  BookingStatus,
  BusinessMemberRole,
  StorageBucketId,
  UserRole,
  VerificationStatus,
} from "@easylife/shared-types";

export interface AuthenticatedActor {
  userId: string;
  primaryRole: UserRole;
  roles: readonly UserRole[];
  isActive: boolean;
  isSuspended: boolean;
  professionalProfile?: {
    id: string;
    verificationStatus: VerificationStatus;
  };
  businessMemberships?: ReadonlyArray<{
    businessId: string;
    memberRole: BusinessMemberRole;
    isOwner: boolean;
    isActive: boolean;
  }>;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason: string;
}

export function isActorAdmin(actor: AuthenticatedActor): boolean {
  return (
    actor.isActive &&
    !actor.isSuspended &&
    (actor.primaryRole === "admin" || actor.roles.includes("admin"))
  );
}

export function canAccessBookingRecord(
  actor: AuthenticatedActor,
  booking: {
    id: string;
    customerId: string;
    professionalId: string | null;
    businessId: string | null;
    status: BookingStatus;
    quotedProfessionalIds?: readonly string[];
  }
): AuthorizationDecision {
  if (!actor.isActive || actor.isSuspended) {
    return { allowed: false, reason: "Account is inactive or suspended." };
  }

  if (isActorAdmin(actor)) {
    return { allowed: true, reason: "Admin access granted." };
  }

  if (booking.customerId === actor.userId) {
    return { allowed: true, reason: "Booking owner access granted." };
  }

  if (booking.businessId && actor.businessMemberships) {
    const hasMembership = actor.businessMemberships.some(
      (m) => m.businessId === booking.businessId && m.isActive
    );
    if (hasMembership) {
      return { allowed: true, reason: "Authorised business member access granted." };
    }
  }

  if (actor.professionalProfile) {
    const proId = actor.professionalProfile.id;
    if (booking.professionalId === proId) {
      return { allowed: true, reason: "Assigned professional access granted." };
    }
    if (booking.quotedProfessionalIds?.includes(proId)) {
      return { allowed: true, reason: "Quoting professional access granted." };
    }
    if (
      (booking.status === "open" || booking.status === "quoted") &&
      actor.professionalProfile.verificationStatus === "approved"
    ) {
      return {
        allowed: true,
        reason: "Verified professional marketplace discovery access granted.",
      };
    }
    return {
      allowed: false,
      reason:
        "FORBIDDEN: Unverified professionals cannot view open marketplace bookings or other professionals' jobs.",
    };
  }

  return {
    allowed: false,
    reason: "FORBIDDEN: Actor is not authorised to access this booking.",
  };
}

export function canSubmitQuotation(
  actor: AuthenticatedActor,
  bookingStatus: BookingStatus
): AuthorizationDecision {
  if (!actor.isActive || actor.isSuspended) {
    return { allowed: false, reason: "Account is inactive or suspended." };
  }
  if (!actor.professionalProfile) {
    return {
      allowed: false,
      reason: "FORBIDDEN: Only professional accounts can submit quotations.",
    };
  }
  if (actor.professionalProfile.verificationStatus !== "approved") {
    return {
      allowed: false,
      reason:
        "FORBIDDEN: Professional verification must be approved before submitting quotations.",
    };
  }
  if (bookingStatus !== "open" && bookingStatus !== "quoted") {
    return {
      allowed: false,
      reason: `INVALID_STATE_TRANSITION: Cannot quote on a booking with status '${bookingStatus}'.`,
    };
  }
  return { allowed: true, reason: "Verified professional allowed to submit quotation." };
}

export function canAccessBusinessResource(
  actor: AuthenticatedActor,
  targetBusinessId: string,
  operation: "read" | "write" | "owner_only"
): AuthorizationDecision {
  if (!actor.isActive || actor.isSuspended) {
    return { allowed: false, reason: "Account is inactive or suspended." };
  }
  if (isActorAdmin(actor)) {
    return { allowed: true, reason: "Admin access granted." };
  }

  const membership = actor.businessMemberships?.find(
    (m) => m.businessId === targetBusinessId && m.isActive
  );
  if (!membership) {
    return {
      allowed: false,
      reason: "FORBIDDEN: User is not an active member of this business.",
    };
  }

  if (operation === "read") {
    return { allowed: true, reason: "Business member read access granted." };
  }

  if (operation === "owner_only") {
    if (membership.isOwner || membership.memberRole === "owner") {
      return { allowed: true, reason: "Business owner access granted." };
    }
    return {
      allowed: false,
      reason: "FORBIDDEN: Only the business owner can perform this operation.",
    };
  }

  // operation === "write"
  if (
    membership.isOwner ||
    membership.memberRole === "owner" ||
    membership.memberRole === "admin" ||
    membership.memberRole === "facility_manager"
  ) {
    return {
      allowed: true,
      reason: "Authorised business manager write access granted.",
    };
  }

  return {
    allowed: false,
    reason: "FORBIDDEN: Business viewers have read-only access.",
  };
}

export function canModifyUserRoleOrVerification(
  actor: AuthenticatedActor,
  action: "grant_admin" | "approve_verification" | "read_audit_logs"
): AuthorizationDecision {
  if (isActorAdmin(actor)) {
    return {
      allowed: true,
      reason: `Admin authorised to perform '${action}'.`,
    };
  }
  return {
    allowed: false,
    reason: `FORBIDDEN: Ordinary users and professionals cannot perform '${action}'.`,
  };
}

export function canAccessPrivateStorageObject(
  actor: AuthenticatedActor,
  bucketId: StorageBucketId,
  storagePath: string,
  context?: {
    bookingCustomerId?: string;
    bookingProfessionalUserId?: string;
    disputeParticipantUserIds?: readonly string[];
  }
): AuthorizationDecision {
  if (!actor.isActive || actor.isSuspended) {
    return { allowed: false, reason: "Account is inactive or suspended." };
  }
  if (isActorAdmin(actor)) {
    return { allowed: true, reason: "Admin storage access granted." };
  }

  const segments = storagePath.split("/").filter(Boolean);
  if (bucketId === "verification-documents") {
    const ownerUserId = segments[0];
    if (ownerUserId === actor.userId) {
      return { allowed: true, reason: "Document owner access granted." };
    }
    return {
      allowed: false,
      reason:
        "FORBIDDEN: Cannot access another professional's private verification documents.",
    };
  }

  if (bucketId === "service-request-media") {
    const uploaderUserId = segments[1];
    if (
      uploaderUserId === actor.userId ||
      context?.bookingCustomerId === actor.userId ||
      context?.bookingProfessionalUserId === actor.userId
    ) {
      return { allowed: true, reason: "Booking participant media access granted." };
    }
    return {
      allowed: false,
      reason: "FORBIDDEN: Cannot access private attachments of an unrelated booking.",
    };
  }

  if (bucketId === "maintenance-and-disputes") {
    const uploaderUserId = segments[1];
    if (
      uploaderUserId === actor.userId ||
      context?.disputeParticipantUserIds?.includes(actor.userId)
    ) {
      return { allowed: true, reason: "Dispute participant access granted." };
    }
    return {
      allowed: false,
      reason: "FORBIDDEN: Cannot access private maintenance or dispute files.",
    };
  }

  return { allowed: true, reason: "Public bucket read allowed." };
}
