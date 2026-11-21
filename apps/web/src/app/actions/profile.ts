"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, clearSession, readAccessToken } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import { supabaseAdminFetch } from "@/lib/supabase/admin";
import { storageService } from "@/lib/storage/storage-service";

export interface ProfileFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function updateCustomerProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { status: "error", message: "You must be signed in to update your profile." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { status: "error", message: "Supabase configuration missing." };
  }

  const fullName = String(formData.get("fullName") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const city = String(formData.get("city") || "Port Harcourt").trim();
  const addressLine = String(formData.get("addressLine") || "").trim();

  if (!fullName || fullName.length < 2) {
    return { status: "error", message: "Full name must be at least 2 characters." };
  }

  let state = "Rivers State";
  if (city === "Lagos") state = "Lagos State";
  if (city === "Abuja") state = "Federal Capital Territory";

  const res = await supabaseFetch(
    config,
    `/rest/v1/profiles?id=eq.${auth.user.id}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        full_name: fullName,
        display_name: displayName || fullName,
        phone: phone || null,
        city,
        state,
        address_line: addressLine || null,
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    return { status: "error", message: res.message || "Failed to update profile." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/bookings");
  revalidatePath("/messages");
  revalidatePath("/notifications");
  revalidatePath("/assistant");
  revalidatePath("/book");

  return { status: "success", message: "Your profile has been saved successfully." };
}

export async function uploadAvatarAction(
  formData: FormData
): Promise<{ ok: boolean; avatarUrl?: string; error?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, error: "You must be signed in to upload a profile photo." };
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Please select an image file to upload." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: "Image file size exceeds the 2 MB limit." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Only JPG, PNG, and WebP images are allowed." };
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${auth.user.id}/avatar-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await storageService.uploadFile({
    bucketId: "avatars",
    path,
    data: buffer,
    mimeType: file.type,
    userId: auth.user.id,
    upsert: true,
  });

  if (!uploadResult.success || !uploadResult.url) {
    return { ok: false, error: uploadResult.error || "Failed to upload image." };
  }

  const avatarUrl = uploadResult.url;

  const config = getSupabasePublicConfig();
  if (config) {
    await supabaseFetch(config, `/rest/v1/profiles?id=eq.${auth.user.id}`, {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
    });

    await supabaseAdminFetch(`/rest/v1/professional_profiles?user_id=eq.${auth.user.id}`, {
      method: "PATCH",
      body: {
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");

  return { ok: true, avatarUrl };
}

export async function removeAvatarAction(): Promise<{ ok: boolean; error?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false, error: "You must be signed in to remove your profile photo." };
  }

  const config = getSupabasePublicConfig();
  if (config) {
    await supabaseFetch(config, `/rest/v1/profiles?id=eq.${auth.user.id}`, {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        avatar_url: null,
        updated_at: new Date().toISOString(),
      },
    });

    await supabaseAdminFetch(`/rest/v1/professional_profiles?user_id=eq.${auth.user.id}`, {
      method: "PATCH",
      body: {
        avatar_url: null,
        updated_at: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/pro/profile");
  revalidatePath("/pro/dashboard");

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  try {
    const config = getSupabasePublicConfig();
    const accessToken = await readAccessToken();
    if (config && accessToken) {
      await fetch(`${config.url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
    }
  } catch {
    // Best-effort upstream session revocation; always clear local cookies below.
  }
  await clearSession();
  redirect("/login");
}
