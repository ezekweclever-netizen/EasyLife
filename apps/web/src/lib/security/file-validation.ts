import type { StorageBucketId, UserRole } from "@easylife/shared-types";

export interface BucketValidationRule {
  bucketId: StorageBucketId;
  isPublic: boolean;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
}

export const STORAGE_BUCKET_RULES: Record<
  StorageBucketId,
  BucketValidationRule
> = {
  avatars: {
    bucketId: "avatars",
    isPublic: true,
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
  },
  "portfolio-media": {
    bucketId: "portfolio-media",
    isPublic: true,
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
  },
  "verification-documents": {
    bucketId: "verification-documents",
    isPublic: false,
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
  "service-request-media": {
    bucketId: "service-request-media",
    isPublic: false,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
  "maintenance-and-disputes": {
    bucketId: "maintenance-and-disputes",
    isPublic: false,
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
  "message-attachments": {
    bucketId: "message-attachments",
    isPublic: false,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
  "booking-attachments": {
    bucketId: "booking-attachments",
    isPublic: false,
    maxSizeBytes: 8 * 1024 * 1024, // 8 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
  "maintenance-invoices": {
    bucketId: "maintenance-invoices",
    isPublic: false,
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
  "dispute-evidence": {
    bucketId: "dispute-evidence",
    isPublic: false,
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ],
    allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
  },
} as const;

export interface FileUploadValidationInput {
  bucketId: StorageBucketId;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploaderUserId: string;
  uploaderRole?: UserRole;
}

export interface FileUploadValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates file type, extension, size, and storage path ownership before upload or DB registration.
 */
export function validateStorageUpload(
  input: FileUploadValidationInput
): FileUploadValidationResult {
  const rule = STORAGE_BUCKET_RULES[input.bucketId];
  if (!rule) {
    return { valid: false, reason: "Unknown or unsupported storage bucket." };
  }

  if (
    !input.storagePath ||
    input.storagePath.includes("..") ||
    input.storagePath.startsWith("/") ||
    input.storagePath.includes("\\")
  ) {
    return {
      valid: false,
      reason: "Invalid storage path: path traversal or leading slash detected.",
    };
  }

  if (input.sizeBytes <= 0) {
    return { valid: false, reason: "Uploaded file cannot be empty." };
  }

  if (input.sizeBytes > rule.maxSizeBytes) {
    const maxMb = (rule.maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      reason: `File size exceeds maximum limit of ${maxMb} MB for bucket '${input.bucketId}'.`,
    };
  }

  if (!rule.allowedMimeTypes.includes(input.mimeType.toLowerCase())) {
    return {
      valid: false,
      reason: `MIME type '${input.mimeType}' is not permitted in bucket '${input.bucketId}'.`,
    };
  }

  const extMatch = input.fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = extMatch?.[1] ?? "";
  if (!ext || !rule.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      reason: `File extension '.${ext}' is not permitted in bucket '${input.bucketId}'.`,
    };
  }

  const segments = input.storagePath.split("/").filter(Boolean);
  if (segments.length < 2) {
    return {
      valid: false,
      reason: "Storage path must include an owner or entity folder prefix.",
    };
  }

  // Enforce path ownership convention matching storage.objects RLS policies
  if (
    input.bucketId === "avatars" ||
    input.bucketId === "portfolio-media" ||
    input.bucketId === "verification-documents"
  ) {
    if (segments[0] !== input.uploaderUserId && input.uploaderRole !== "admin") {
      return {
        valid: false,
        reason:
          "FORBIDDEN: First folder segment must match the authenticated uploader user_id.",
      };
    }
  } else if (
    input.bucketId === "service-request-media" ||
    input.bucketId === "maintenance-and-disputes"
  ) {
    if (
      segments.length < 3 ||
      (segments[1] !== input.uploaderUserId && input.uploaderRole !== "admin")
    ) {
      return {
        valid: false,
        reason:
          "FORBIDDEN: Path must follow '{entity_id}/{uploader_user_id}/{filename}' convention.",
      };
    }
  }

  return { valid: true };
}
