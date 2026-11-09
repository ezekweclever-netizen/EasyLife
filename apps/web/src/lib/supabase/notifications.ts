import { getSupabasePublicConfig, supabaseFetch } from "@/lib/supabase/rest";
import type { NotificationDeliveryStatus } from "@easylife/shared-types";

export interface NotificationDeliveryItem {
  id: string;
  channel: "in_app" | "email" | "push" | "sms" | "whatsapp";
  recipient_destination: string;
  provider: string;
  status: NotificationDeliveryStatus;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  retry_count: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  channels: string[];
  is_read: boolean;
  read_at: string | null;
  delivery_status: NotificationDeliveryStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  deliveries?: NotificationDeliveryItem[];
}

/**
 * Fetch notifications for user with their channel delivery statuses
 */
export async function getUserNotifications(
  userId: string,
  accessToken: string,
  limit = 20
): Promise<NotificationItem[]> {
  const config = getSupabasePublicConfig();
  if (!config) return [];

  const res = await supabaseFetch<
    Array<
      NotificationItem & {
        notification_deliveries?: NotificationDeliveryItem[];
      }
    >
  >(
    config,
    `/rest/v1/notifications?select=id,user_id,notification_type,title,body,action_url,entity_type,entity_id,channels,is_read,read_at,delivery_status,metadata,created_at,notification_deliveries(id,channel,recipient_destination,provider,status,sent_at,delivered_at,failed_at,error_code,error_message,retry_count)&user_id=eq.${encodeURIComponent(
      userId
    )}&order=created_at.desc&limit=${limit}`,
    {
      method: "GET",
      accessToken,
    }
  );

  if (!res.ok || !Array.isArray(res.data)) {
    return [];
  }

  return res.data.map((item) => ({
    ...item,
    deliveries: item.notification_deliveries || [],
  }));
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadNotificationCount(
  userId: string,
  accessToken: string
): Promise<number> {
  const config = getSupabasePublicConfig();
  if (!config) return 0;

  const res = await supabaseFetch<Array<{ count: number }>>(
    config,
    `/rest/v1/notifications?select=count&user_id=eq.${encodeURIComponent(
      userId
    )}&is_read=eq.false`,
    {
      method: "GET",
      accessToken,
      headers: {
        Prefer: "count=exact",
      },
    }
  );

  if (!res.ok) return 0;
  // If count header is parsed, or data contains array
  return Array.isArray(res.data) && res.data.length > 0 ? (res.data[0] as any).count || res.data.length : 0;
}
