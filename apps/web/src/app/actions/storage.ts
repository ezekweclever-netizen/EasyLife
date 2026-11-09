"use server";

import { StorageBucketId } from "@easylife/shared-types";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { storageService } from "@/lib/storage/storage-service";

/**
 * Retrieves access URL for a storage object.
 * - Public buckets return direct public URL.
 * - Private buckets enforce authentication and ownership/admin permission before generating a signed URL.
 */
export async function getFileAccessUrlAction(
  bucketId: StorageBucketId,
  path: string
): Promise<{ success: boolean; url: string | null; error?: string }> {
  try {
    if (!path || !bucketId) {
      return { success: false, url: null, error: "Bucket and path are required." };
    }

    // If bucket is public, immediately return public URL
    if (storageService.isPublic(bucketId)) {
      return {
        success: true,
        url: storageService.getPublicUrl(bucketId, path),
      };
    }

    // Private bucket: requires authenticated session
    const auth = await getAuthenticatedUser();
    if (!auth?.user) {
      return {
        success: false,
        url: null,
        error: "Authentication required to access private documents.",
      };
    }

    // Verify folder ownership: first path component should equal auth.user.id
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const pathOwner = cleanPath.split("/")[0];

    if (pathOwner !== auth.user.id) {
      return {
        success: false,
        url: null,
        error: "Access denied. You do not have permission to view this file.",
      };
    }

    const { signedUrl, error } = await storageService.createSignedUrl(
      bucketId,
      cleanPath,
      3600 // 1 hour expiration
    );

    if (error || !signedUrl) {
      return { success: false, url: null, error: error || "Failed to generate access URL." };
    }

    return { success: true, url: signedUrl };
  } catch (err: any) {
    return { success: false, url: null, error: err.message };
  }
}

/**
 * Uploads file via FormData server action.
 * Enforces authenticated session and user folder prefixing.
 */
export async function uploadFileAction(formData: FormData): Promise<{
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}> {
  const auth = await getAuthenticatedUser();
  if (!auth?.user) {
    return { success: false, error: "Authentication required to upload files." };
  }

  const file = formData.get("file") as File | null;
  const bucketId = formData.get("bucketId") as StorageBucketId | null;

  if (!file || !bucketId) {
    return { success: false, error: "Missing file or bucketId in upload request." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}_${sanitizedFileName}`;
  const path = `${auth.user.id}/${uniqueName}`;

  const result = await storageService.uploadFile({
    bucketId,
    path,
    data: buffer,
    mimeType: file.type || "application/octet-stream",
    userId: auth.user.id,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    path: result.path,
    url: result.url,
  };
}
