import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  getUserNotifications,
  getUnreadNotificationCount,
} from "@/lib/supabase/notifications";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json(
      { notifications: [], unreadCount: 0 },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(auth.user.id, auth.accessToken, 15),
    getUnreadNotificationCount(auth.user.id, auth.accessToken),
  ]);

  return NextResponse.json(
    { notifications, unreadCount },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
