"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser, clearSession } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

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

  return { status: "success", message: "Your profile has been saved successfully." };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
