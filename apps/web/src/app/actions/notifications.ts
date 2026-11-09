"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";

/**
 * Mark a single notification as read
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<{ success: boolean; message?: string }> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { success: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { success: false, message: "Database service temporarily unavailable." };
  }

  const res = await supabaseFetch(
    config,
    `/rest/v1/notifications?id=eq.${encodeURIComponent(
      notificationId
    )}&user_id=eq.${encodeURIComponent(auth.user.id)}`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        is_read: true,
        read_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    return { success: false, message: res.message };
  }

  revalidatePath("/messages");
  revalidatePath("/pro/messages");
  revalidatePath("/dashboard");
  revalidatePath("/pro/dashboard");

  return { success: true };
}

/**
 * Mark all notifications for the authenticated user as read
 */
export async function markAllNotificationsReadAction(): Promise<{
  success: boolean;
  message?: string;
}> {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { success: false, message: "Authentication required." };
  }

  const config = getSupabasePublicConfig();
  if (!config) {
    return { success: false, message: "Database service temporarily unavailable." };
  }

  const res = await supabaseFetch(
    config,
    `/rest/v1/notifications?user_id=eq.${encodeURIComponent(
      auth.user.id
    )}&is_read=eq.false`,
    {
      method: "PATCH",
      accessToken: auth.accessToken,
      body: {
        is_read: true,
        read_at: new Date().toISOString(),
      },
    }
  );

  if (!res.ok) {
    return { success: false, message: res.message };
  }

  revalidatePath("/messages");
  revalidatePath("/pro/messages");
  revalidatePath("/dashboard");
  revalidatePath("/pro/dashboard");

  return { success: true };
}
