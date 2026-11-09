/**
 * EasyLife Supabase Storage Service
 * 
 * Strict compliance:
 * - Public vs Private access separation
 *   - Public: 'avatars', 'portfolio-media'
 *   - Private: 'booking-attachments', 'verification-documents', 'maintenance-invoices', 'dispute-evidence'
 * - Server-side signed URLs for private asset access
 * - Input validation against file types and size quotas
 */

import { StorageBucketId } from "@easylife/shared-types";
import { getSupabasePublicConfig } from "@/lib/supabase/rest";
import { getSupabaseAdminKey } from "@/lib/supabase/admin";
import {
  STORAGE_BUCKET_RULES,
  validateStorageUpload,
} from "@/lib/security/file-validation";

export interface StorageUploadOptions {
  bucketId: StorageBucketId;
  path: string;
  data: Buffer | Uint8Array;
  mimeType: string;
  userId: string;
  upsert?: boolean;
}

export interface StorageUploadResult {
  success: boolean;
  path?: string;
  url?: string;
  isPublic?: boolean;
  error?: string;
}

export class StorageService {
  /**
   * Checks if a bucket is marked public
   */
  isPublic(bucketId: StorageBucketId): boolean {
    return STORAGE_BUCKET_RULES[bucketId]?.isPublic ?? false;
  }

  /**
   * Generates public CDN URL for public buckets
   */
  getPublicUrl(bucketId: StorageBucketId, path: string): string {
    const config = getSupabasePublicConfig();
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const baseUrl = config?.url || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return `${baseUrl}/storage/v1/object/public/${bucketId}/${cleanPath}`;
  }

  /**
   * Generates a time-limited signed URL for private bucket objects
   */
  async createSignedUrl(
    bucketId: StorageBucketId,
    path: string,
    expiresInSeconds: number = 3600
  ): Promise<{ signedUrl: string | null; error?: string }> {
    const config = getSupabasePublicConfig();
    const adminKey = getSupabaseAdminKey();

    if (!config || !adminKey) {
      return {
        signedUrl: null,
        error: "Supabase configuration or admin key is missing.",
      };
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const signUrl = `${config.url}/storage/v1/object/sign/${bucketId}/${cleanPath}`;

    try {
      const res = await fetch(signUrl, {
        method: "POST",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          signedUrl: null,
          error: `Storage sign failed (${res.status}): ${errText}`,
        };
      }

      const json = await res.json();
      if (!json.signedURL) {
        return { signedUrl: null, error: "Missing signedURL in response." };
      }

      // Supabase returns relative or absolute path; ensure full URL
      const relative = json.signedURL.startsWith("/")
        ? json.signedURL
        : `/${json.signedURL}`;
      const fullUrl = `${config.url}/storage/v1${relative}`;

      return { signedUrl: fullUrl };
    } catch (err: any) {
      return { signedUrl: null, error: err.message };
    }
  }

  /**
   * Uploads file binary to specified bucket with ownership and validation check
   */
  async uploadFile(options: StorageUploadOptions): Promise<StorageUploadResult> {
    const { bucketId, path, data, mimeType, userId, upsert = true } = options;

    // 1. Validation check
    const fileName = path.split("/").pop() || "file";
    const validation = validateStorageUpload({
      bucketId,
      storagePath: path,
      fileName,
      mimeType,
      sizeBytes: data.byteLength,
      uploaderUserId: userId,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason || "File validation failed.",
      };
    }

    const config = getSupabasePublicConfig();
    const adminKey = getSupabaseAdminKey();

    if (!config || !adminKey) {
      return {
        success: false,
        error: "Supabase admin key or URL is unconfigured.",
      };
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const uploadUrl = `${config.url}/storage/v1/object/${bucketId}/${cleanPath}`;

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": mimeType,
          "x-upsert": upsert ? "true" : "false",
        },
        body: data as unknown as BodyInit,
      });

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          error: `Storage upload failed (${res.status}): ${errText}`,
        };
      }

      const isPub = this.isPublic(bucketId);
      const url = isPub ? this.getPublicUrl(bucketId, cleanPath) : undefined;

      return {
        success: true,
        path: cleanPath,
        url,
        isPublic: isPub,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Deletes a file from bucket
   */
  async deleteFile(
    bucketId: StorageBucketId,
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    const config = getSupabasePublicConfig();
    const adminKey = getSupabaseAdminKey();

    if (!config || !adminKey) {
      return { success: false, error: "Missing storage configuration." };
    }

    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const deleteUrl = `${config.url}/storage/v1/object/${bucketId}/${cleanPath}`;

    try {
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          apikey: adminKey,
          Authorization: `Bearer ${adminKey}`,
        },
      });

      return { success: res.ok };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const storageService = new StorageService();
