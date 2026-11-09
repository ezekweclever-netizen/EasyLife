/**
 * Sliding-Window Rate Limiter for Sensitive Server Endpoints
 * Protects Auth, AI Problem Categorization, Quotation Submission,
 * Dispute Creation, and Administrative Endpoints.
 */

export interface RateLimitConfig {
  id: string;
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMIT_POLICIES = {
  AUTH_ATTEMPT: {
    id: "auth_attempt",
    windowMs: 60_000, // 1 minute
    maxRequests: 10,
  },
  AI_CATEGORIZATION: {
    id: "ai_categorization",
    windowMs: 60_000, // 1 minute
    maxRequests: 8,
  },
  QUOTATION_SUBMISSION: {
    id: "quotation_submission",
    windowMs: 60_000, // 1 minute
    maxRequests: 15,
  },
  DISPUTE_CREATION: {
    id: "dispute_creation",
    windowMs: 300_000, // 5 minutes
    maxRequests: 5,
  },
  ADMIN_MUTATION: {
    id: "admin_mutation",
    windowMs: 60_000, // 1 minute
    maxRequests: 30,
  },
  REGISTRATION_ATTEMPT: {
    id: "registration_attempt",
    windowMs: 600_000, // 10 minutes
    maxRequests: 5,
  },
  CONTACT_SUBMISSION: {
    id: "contact_submission",
    windowMs: 600_000, // 10 minutes
    maxRequests: 5,
  },
} as const satisfies Record<string, RateLimitConfig>;

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const bucketStore = new Map<string, number[]>();

export function checkRateLimit(
  policy: RateLimitConfig,
  identifier: string,
  nowMs: number = Date.now()
): RateLimitCheckResult {
  const key = `${policy.id}:${identifier}`;
  const windowStart = nowMs - policy.windowMs;
  const existingTimestamps = bucketStore.get(key) ?? [];
  const activeTimestamps = existingTimestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= policy.maxRequests) {
    const oldestInWindow = activeTimestamps[0] ?? nowMs;
    const retryAfterMs = Math.max(1000, oldestInWindow + policy.windowMs - nowMs);
    bucketStore.set(key, activeTimestamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  activeTimestamps.push(nowMs);
  bucketStore.set(key, activeTimestamps);

  return {
    allowed: true,
    remaining: Math.max(0, policy.maxRequests - activeTimestamps.length),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimitStore(): void {
  bucketStore.clear();
}
