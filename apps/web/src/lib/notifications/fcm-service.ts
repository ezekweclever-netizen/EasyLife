/**
 * EasyLife Firebase Cloud Messaging (FCM) Service
 * Supports Push Notifications for Flutter Android & iOS applications.
 */

import crypto from "node:crypto";
import { PushNotificationPayload, PushNotificationResult } from "./types";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function fetchGoogleFcmAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const normalizedKey = privateKeyPem.replace(/\\n/g, "\n");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = base64UrlEncode(signer.sign(normalizedKey));
  const assertion = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  if (!tokenRes.ok) {
    throw new Error(`OAuth2 token exchange failed (${tokenRes.status})`);
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Google OAuth2 response missing access_token");
  }
  return tokenJson.access_token;
}

export function buildFcmMessagePayload(payload: PushNotificationPayload) {
  const timestamp = new Date().toISOString();
  return {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      notification_type: payload.type,
      timestamp,
      ...payload.data,
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channel_id: "easylife_high_importance",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };
}

export class FcmPushNotificationService {
  private projectId: string | null;
  private clientEmail: string | null;
  private privateKey: string | null;

  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID?.trim() || null;
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() || null;
    this.privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim() || null;
  }

  /**
   * Dispatches push notification to user devices (Android & iOS)
   */
  async sendPushNotification(
    payload: PushNotificationPayload
  ): Promise<PushNotificationResult> {
    const timestamp = new Date().toISOString();

    // 1. Fetch active device tokens for recipient
    let tokens = payload.deviceTokens || [];
    if (tokens.length === 0) {
      try {
        const tokensRes = await supabaseAdminFetch<Array<{ device_token: string }>>(
          `/rest/v1/user_device_tokens?select=device_token&user_id=eq.${encodeURIComponent(
            payload.recipientUserId
          )}&is_active=eq.true`
        );
        if (tokensRes.ok && Array.isArray(tokensRes.data)) {
          tokens = tokensRes.data.map((t) => t.device_token);
        }
      } catch (err) {
        console.warn("Failed to fetch device tokens from database:", err);
      }
    }

    // 2. Prepare Flutter Mobile App compliant FCM payload
    const fcmMessage = buildFcmMessagePayload(payload);

    // 3. Live FCM HTTP v1 Dispatch if Firebase Admin credentials and device tokens exist
    let dispatchedCount = 0;
    let lastLiveMessageId: string | null = null;
    if (this.projectId && this.clientEmail && this.privateKey && tokens.length > 0) {
      try {
        const accessToken = await fetchGoogleFcmAccessToken(
          this.clientEmail,
          this.privateKey
        );
        const endpoint = `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(
          this.projectId
        )}/messages:send`;

        const stringData: Record<string, string> = {};
        for (const [k, v] of Object.entries(fcmMessage.data)) {
          stringData[k] = String(v);
        }

        for (const token of tokens) {
          const fcmRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                token,
                notification: fcmMessage.notification,
                data: stringData,
                android: {
                  priority: "HIGH",
                  notification: fcmMessage.android.notification,
                },
                apns: fcmMessage.apns,
              },
            }),
          });

          if (fcmRes.ok) {
            const fcmJson = (await fcmRes.json().catch(() => null)) as { name?: string } | null;
            dispatchedCount += 1;
            lastLiveMessageId = fcmJson?.name || `fcm-${Date.now()}`;
          }
        }
      } catch (err: any) {
        console.warn("FCM live dispatch failed, logging offline:", err.message);
      }
    }

    const liveSuccess = dispatchedCount > 0;

    // 4. Record in-app notification in public.notifications table
    try {
      await supabaseAdminFetch("/rest/v1/notifications", {
        method: "POST",
        body: {
          user_id: payload.recipientUserId,
          title: payload.title,
          body: payload.body,
          notification_type: payload.type,
          metadata: payload.data || {},
          delivery_status: liveSuccess ? "delivered" : "logged_offline",
          push_sent_at: liveSuccess ? timestamp : null,
          is_read: false,
          created_at: timestamp,
        },
      });
    } catch (err) {
      console.warn("Failed to record in-app notification:", err);
    }

    if (liveSuccess) {
      return {
        success: true,
        messageId: lastLiveMessageId || `fcm-${Date.now()}`,
        provider: "fcm",
        status: "dispatched",
        recipientCount: dispatchedCount,
        timestamp,
      };
    }

    const mockId = `mock-fcm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(
      `[FCM Service] Logged push [${payload.type}] for user ${payload.recipientUserId}: "${payload.title}" (${tokens.length} registered device tokens)`
    );

    return {
      success: true,
      messageId: mockId,
      provider: "logged_offline",
      status: "logged_offline",
      recipientCount: tokens.length,
      timestamp,
    };
  }

  /**
   * Register or refresh a device token in public.user_device_tokens
   */
  async registerDeviceToken(params: {
    userId: string;
    deviceToken: string;
    platform: "android" | "ios" | "web";
    deviceName?: string;
  }): Promise<boolean> {
    const res = await supabaseAdminFetch<any>("/rest/v1/rpc/register_user_device_token", {
      method: "POST",
      body: {
        p_user_id: params.userId,
        p_device_token: params.deviceToken,
        p_platform: params.platform,
        p_device_name: params.deviceName || null,
      },
    });

    return res.ok;
  }
}

export const fcmService = new FcmPushNotificationService();
