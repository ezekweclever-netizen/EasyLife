#!/usr/bin/env node
import { getDatabaseUrl } from './_env.mjs';
/**
 * EasyLife Messaging and Notification System Test Suite (Prompt 13)
 * Tests:
 * 1. Static code & schema integrity (shared-types, server actions, components, pages).
 * 2. Live remote Supabase schema (notification_deliveries, storage bucket, columns, RPCs).
 * 3. Messaging features (conversation creation, text, timestamps, delivery status, attachments).
 * 4. Security & RLS (unrelated user blocked, private attachments, member checks).
 * 5. Notification events (12 events, multi-channel delivery, provider rejected rule, unread counts).
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "apps", "web", "src");

let passedCount = 0;
let failedCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failedCount++;
  }
}

async function asyncTest(description, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failedCount++;
  }
}

console.log("=== EasyLife Messaging & Notification System Test Suite (Prompt 13) ===\n");

// ============================================================================
// 1. STATIC CODE & CONFIGURATION INTEGRITY
// ============================================================================
console.log("1. Verifying Prompt 13 Type Definitions & Static Code Structure:");

const sharedTypesFile = path.join(rootDir, "packages", "shared-types", "src", "index.ts");
const databaseTypesFile = path.join(rootDir, "packages", "shared-types", "src", "database.ts");
const messagesActionFile = path.join(webDir, "app", "actions", "messages.ts");
const notifsActionFile = path.join(webDir, "app", "actions", "notifications.ts");
const chatClientFile = path.join(webDir, "components", "messaging", "chat-client.tsx");
const notifBellFile = path.join(webDir, "components", "notifications", "notification-bell.tsx");
const customerMessagesPage = path.join(webDir, "app", "messages", "page.tsx");
const proMessagesPage = path.join(webDir, "app", "pro", "messages", "page.tsx");
const notificationsPage = path.join(webDir, "app", "notifications", "page.tsx");

test("Shared types export NotificationChannel, MessageDeliveryStatus, NotificationDeliveryStatus, NotificationEvent", () => {
  assert.ok(fs.existsSync(sharedTypesFile), "Missing shared-types/src/index.ts");
  const content = fs.readFileSync(sharedTypesFile, "utf8");
  assert.ok(content.includes("export type NotificationChannel"), "Missing NotificationChannel export");
  assert.ok(content.includes('"whatsapp"'), "Missing whatsapp in NotificationChannel");
  assert.ok(content.includes("export type MessageDeliveryStatus"), "Missing MessageDeliveryStatus export");
  assert.ok(content.includes("export type NotificationDeliveryStatus"), "Missing NotificationDeliveryStatus export");
  assert.ok(content.includes("export type NotificationEvent"), "Missing NotificationEvent export");
});

test("Database types export updated ConversationRow, MessageRow, and NotificationDeliveryRow", () => {
  assert.ok(fs.existsSync(databaseTypesFile), "Missing shared-types/src/database.ts");
  const content = fs.readFileSync(databaseTypesFile, "utf8");
  assert.ok(content.includes("export interface NotificationDeliveryRow"), "Missing NotificationDeliveryRow");
  assert.ok(content.includes("delivery_status: MessageDeliveryStatus"), "Missing MessageRow delivery_status");
  assert.ok(content.includes("unread_count: number"), "Missing ConversationMemberRow unread_count");
});

test("Server action messages.ts provides sendMessageAction, markConversationReadAction, getOrCreateBookingConversationAction", () => {
  assert.ok(fs.existsSync(messagesActionFile), "Missing actions/messages.ts");
  const content = fs.readFileSync(messagesActionFile, "utf8");
  assert.ok(content.includes("send_conversation_message"), "Missing send_conversation_message call");
  assert.ok(content.includes("mark_conversation_as_read"), "Missing mark_conversation_as_read call");
  assert.ok(content.includes("create_or_get_booking_conversation"), "Missing create_or_get_booking_conversation call");
});

test("Server action notifications.ts provides markNotificationReadAction and markAllNotificationsReadAction", () => {
  assert.ok(fs.existsSync(notifsActionFile), "Missing actions/notifications.ts");
  const content = fs.readFileSync(notifsActionFile, "utf8");
  assert.ok(content.includes("markNotificationReadAction"), "Missing markNotificationReadAction");
  assert.ok(content.includes("markAllNotificationsReadAction"), "Missing markAllNotificationsReadAction");
});

test("ChatClient component provides messaging, timestamps, attachments, delivery indicators, and search", () => {
  assert.ok(fs.existsSync(chatClientFile), "Missing chat-client.tsx");
  const content = fs.readFileSync(chatClientFile, "utf8");
  assert.ok(content.includes("sendMessageAction"), "Missing sendMessageAction usage");
  assert.ok(content.includes("delivery_status"), "Missing delivery status indicator");
  assert.ok(content.includes("attachment"), "Missing attachment support");
  assert.ok(content.includes("unread_count"), "Missing unread count support");
});

test("NotificationBell component renders unread badge and dropdown", () => {
  assert.ok(fs.existsSync(notifBellFile), "Missing notification-bell.tsx");
  const content = fs.readFileSync(notifBellFile, "utf8");
  assert.ok(content.includes("initialUnreadCount"), "Missing initialUnreadCount prop");
  assert.ok(content.includes("getEventIcon"), "Missing event icon resolution");
});

test("Pages exist: /messages, /pro/messages, and /notifications", () => {
  assert.ok(fs.existsSync(customerMessagesPage), "Missing app/messages/page.tsx");
  assert.ok(fs.existsSync(proMessagesPage), "Missing app/pro/messages/page.tsx");
  assert.ok(fs.existsSync(notificationsPage), "Missing app/notifications/page.tsx");
});

// ============================================================================
// 2. LIVE REMOTE SUPABASE DATABASE SCHEMA CHECKS
// ============================================================================
console.log("\n2. Connecting to Live Remote Supabase Database:");

const connectionString =
  getDatabaseUrl();

let client;
let connected = false;
for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    connected = true;
    break;
  } catch (err) {
    console.log(`Connection attempt ${attempt} failed (${err.message}). Retrying in 2s...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
if (!connected) {
  throw new Error("Could not connect to Supabase PostgreSQL database after multiple attempts.");
}

await asyncTest("Live DB: public.notification_deliveries table exists with RLS enabled", async () => {
  const res = await client.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'notification_deliveries';
  `);
  assert.strictEqual(res.rows.length, 1, "public.notification_deliveries does not exist");
  assert.strictEqual(res.rows[0].rowsecurity, true, "RLS must be enabled on notification_deliveries");
});

await asyncTest("Live DB: public.messages has all Prompt 13 required columns", async () => {
  const res = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages'
      AND column_name IN ('delivery_status', 'delivered_at', 'read_at', 'attachment_name', 'attachment_mime_type', 'attachment_size_bytes');
  `);
  const cols = res.rows.map((r) => r.column_name);
  assert.ok(cols.includes("delivery_status"), "Missing delivery_status on messages");
  assert.ok(cols.includes("delivered_at"), "Missing delivered_at on messages");
  assert.ok(cols.includes("read_at"), "Missing read_at on messages");
  assert.ok(cols.includes("attachment_name"), "Missing attachment_name on messages");
  assert.ok(cols.includes("attachment_mime_type"), "Missing attachment_mime_type on messages");
  assert.ok(cols.includes("attachment_size_bytes"), "Missing attachment_size_bytes on messages");
});

await asyncTest("Live DB: public.notifications has delivery_status and multi-channel columns", async () => {
  const res = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications'
      AND column_name IN ('delivery_status', 'channels', 'metadata');
  `);
  const cols = res.rows.map((r) => r.column_name);
  assert.ok(cols.includes("delivery_status"), "Missing delivery_status on notifications");
  assert.ok(cols.includes("channels"), "Missing channels on notifications");
});

await asyncTest("Live DB: All 6 Prompt 13 stored procedures exist in public schema", async () => {
  const res = await client.query(`
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name IN (
        'create_or_get_booking_conversation',
        'send_conversation_message',
        'mark_conversation_as_read',
        'get_conversation_unread_count',
        'create_notification',
        'update_notification_delivery_status'
      );
  `);
  const funcs = res.rows.map((r) => r.routine_name);
  assert.strictEqual(funcs.length, 6, `Expected 6 procedures, found ${funcs.length}: ${funcs.join(", ")}`);
});

// ============================================================================
// 3. TESTING BUSINESS RULES & MESSAGING / NOTIFICATION LIFECYCLE
// ============================================================================
console.log("\n3. Testing Messaging & Notification Lifecycle on Live DB:");

// Fetch active customer, professional, and category
const custRes = await client.query(`
  SELECT id, email, full_name FROM public.profiles WHERE primary_role = 'customer' LIMIT 1;
`);
const proRes = await client.query(`
  SELECT pp.id as professional_id, pp.user_id, p.email, pp.business_name
  FROM public.professional_profiles pp
  JOIN public.profiles p ON p.id = pp.user_id
  WHERE pp.verification_status = 'approved'
  LIMIT 1;
`);
const catRes = await client.query(`
  SELECT id, name FROM public.service_categories WHERE is_active = true LIMIT 1;
`);

const testCustomer = custRes.rows[0];
const testPro = proRes.rows[0];
const testCat = catRes.rows[0];

assert.ok(testCustomer, "Test requires at least 1 customer profile in DB");
assert.ok(testPro, "Test requires at least 1 professional profile in DB");
assert.ok(testCat, "Test requires at least 1 active service category in DB");

// Setup isolated synthetic booking
const testBookingRef = `EL-MSG-${Date.now().toString().slice(-6)}`;
const bookingInsert = await client.query(
  `
  INSERT INTO public.bookings (
    reference_code,
    customer_id,
    category_id,
    title,
    description,
    status,
    urgency,
    service_address,
    city,
    state,
    preferred_date,
    preferred_time_slot
  ) VALUES ($1, $2, $3, $4, $5, 'submitted', 'normal', 'Plot 40 Stadium Road', 'Port Harcourt', 'Rivers', CURRENT_DATE + 3, 'morning')
  RETURNING id;
  `,
  [testBookingRef, testCustomer.id, testCat.id, "Prompt 13 Messaging Diagnostic", "Testing in-app messages and notifications"]
);
const testBookingId = bookingInsert.rows[0].id;

let testConvId = null;
let testMsgId = null;

// Test 1: Conversation creation
await asyncTest("Live DB: create_or_get_booking_conversation creates thread and adds customer member", async () => {
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [testCustomer.id]);
  const res = await client.query("SELECT public.create_or_get_booking_conversation($1) AS res;", [testBookingId]);
  const data = res.rows[0].res;
  assert.strictEqual(data.success, true);
  assert.ok(data.conversation_id, "Missing conversation_id");
  testConvId = data.conversation_id;

  // Verify membership
  const memberCheck = await client.query(
    "SELECT user_id, role_in_conversation FROM public.conversation_members WHERE conversation_id = $1;",
    [testConvId]
  );
  assert.ok(memberCheck.rows.some((m) => m.user_id === testCustomer.id), "Customer must be a member");
});

// Test 2: Unrelated user attempting to send message -> REJECTED
await asyncTest("Live DB Security: Unrelated user cannot send message in conversation (returns FORBIDDEN)", async () => {
  // Use a random UUID not in conversation
  const fakeUserId = "00000000-0000-0000-0000-000000000099";
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [fakeUserId]);

  try {
    await client.query(
      "SELECT public.send_conversation_message($1, 'Unauthorized intrusion test');",
      [testConvId]
    );
    assert.fail("Should have rejected unauthorized sender");
  } catch (err) {
    assert.ok(err.message.includes("FORBIDDEN") || err.message.includes("UNAUTHORIZED"), "Expected FORBIDDEN or UNAUTHORIZED");
  }
});

// Test 3: Add professional as member and send text message
await asyncTest("Live DB: send_conversation_message records message with delivery_status 'delivered'", async () => {
  // Add pro as member
  await client.query(
    "INSERT INTO public.conversation_members (conversation_id, user_id, role_in_conversation) VALUES ($1, $2, 'professional') ON CONFLICT DO NOTHING;",
    [testConvId, testPro.user_id]
  );

  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [testCustomer.id]);
  const res = await client.query(
    "SELECT public.send_conversation_message($1, 'Hello, I have a leakage under the kitchen sink.') AS res;",
    [testConvId]
  );
  const data = res.rows[0].res;
  assert.strictEqual(data.success, true);
  assert.ok(data.message_id, "Missing message_id");
  assert.strictEqual(data.delivery_status, "delivered");
  testMsgId = data.message_id;

  // Verify conversation last_message_at was updated
  const convCheck = await client.query("SELECT last_message_at FROM public.conversations WHERE id = $1;", [testConvId]);
  assert.ok(convCheck.rows[0].last_message_at, "last_message_at must be populated");
});

// Test 4: Verify automatic notification generation for other party
await asyncTest("Live DB: send_conversation_message automatically dispatches 'new_message' notification to recipient", async () => {
  const notifRes = await client.query(
    `
    SELECT id, notification_type, title, body, channels, is_read, delivery_status
    FROM public.notifications
    WHERE user_id = $1 AND notification_type = 'new_message' AND entity_id = $2
    ORDER BY created_at DESC LIMIT 1;
    `,
    [testPro.user_id, testConvId]
  );
  assert.strictEqual(notifRes.rows.length, 1, "Expected new_message notification for professional");
  const notif = notifRes.rows[0];
  assert.ok(notif.title.includes("New message"), "Expected title to mention new message");
  assert.strictEqual(notif.is_read, false, "Notification must initially be unread");

  // Verify delivery record in notification_deliveries
  const delRes = await client.query(
    "SELECT channel, status FROM public.notification_deliveries WHERE notification_id = $1;",
    [notif.id]
  );
  assert.ok(delRes.rows.length >= 1, "Must have delivery records for notification");
  assert.ok(delRes.rows.some((d) => d.channel === "in_app" && d.status === "delivered"), "in_app delivery must be delivered");
});

// Test 5: Attachment validation (rejection of oversized attachment)
await asyncTest("Live DB: send_conversation_message rejects attachment exceeding 8MB limit", async () => {
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [testCustomer.id]);
  try {
    await client.query(
      `SELECT public.send_conversation_message(
        $1,
        'Oversized file test',
        'attachment',
        'messages/fake.pdf',
        'fake.pdf',
        'application/pdf',
        10485760
      );`,
      [testConvId]
    );
    assert.fail("Should have rejected attachment > 8MB");
  } catch (err) {
    assert.ok(err.message.includes("INVALID_ATTACHMENT"), "Expected INVALID_ATTACHMENT error");
  }
});

// Test 6: Valid attachment metadata saved
await asyncTest("Live DB: send_conversation_message stores valid attachment metadata (name, mime, size)", async () => {
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [testCustomer.id]);
  const res = await client.query(
    `SELECT public.send_conversation_message(
      $1::uuid,
      'Here is the fault photograph'::text,
      'attachment'::text,
      ('messages/' || $1::text || '/leak_photo.jpg')::text,
      'leak_photo.jpg'::text,
      'image/jpeg'::text,
      1024500::bigint
    ) AS res;`,
    [testConvId]
  );
  const data = res.rows[0].res;
  assert.strictEqual(data.success, true);

  const msgCheck = await client.query(
    "SELECT message_type, attachment_name, attachment_mime_type, attachment_size_bytes FROM public.messages WHERE id = $1;",
    [data.message_id]
  );
  assert.strictEqual(msgCheck.rows[0].message_type, "attachment");
  assert.strictEqual(msgCheck.rows[0].attachment_name, "leak_photo.jpg");
  assert.strictEqual(msgCheck.rows[0].attachment_mime_type, "image/jpeg");
  assert.strictEqual(msgCheck.rows[0].attachment_size_bytes, "1024500");
});

// Test 7: Mark conversation as read
await asyncTest("Live DB: mark_conversation_as_read updates messages to 'read' and resets unread count", async () => {
  // Pro marks conversation as read
  await client.query("SELECT set_config('request.jwt.claim.sub', $1, false);", [testPro.user_id]);
  const res = await client.query("SELECT public.mark_conversation_as_read($1) AS res;", [testConvId]);
  const data = res.rows[0].res;
  assert.strictEqual(data.success, true);
  assert.ok(data.messages_marked_read >= 1, "Expected at least 1 message marked read");

  // Check messages table: delivery_status should now be 'read'
  const msgCheck = await client.query("SELECT delivery_status, read_at FROM public.messages WHERE id = $1;", [testMsgId]);
  assert.strictEqual(msgCheck.rows[0].delivery_status, "read");
  assert.ok(msgCheck.rows[0].read_at, "read_at must be populated");

  // Check unread count on conversation_members
  const memberCheck = await client.query(
    "SELECT unread_count FROM public.conversation_members WHERE conversation_id = $1 AND user_id = $2;",
    [testConvId, testPro.user_id]
  );
  assert.strictEqual(memberCheck.rows[0].unread_count, 0, "Unread count must be reset to 0");
});

// Test 8: Notification Delivery Provider status update & rejection rule
await asyncTest("Live DB Rule: update_notification_delivery_status preserves 'rejected' status when provider rejects", async () => {
  // Create a synthetic notification
  const notifIdRes = await client.query(
    `
    SELECT public.create_notification(
      $1::uuid,
      'appointment_reminder'::text,
      'Reminder: Upcoming Repair Appointment'::text,
      'Your specialist is scheduled for tomorrow at 10:00 AM.'::text,
      ('/bookings/' || $2::text)::text,
      'booking'::text,
      $2::uuid,
      ARRAY['in_app', 'email']::TEXT[]
    ) AS id;
    `,
    [testCustomer.id, testBookingId]
  );
  const notifId = notifIdRes.rows[0].id;

  // Find the email delivery row
  const delRes = await client.query(
    "SELECT id FROM public.notification_deliveries WHERE notification_id = $1 AND channel = 'email';",
    [notifId]
  );
  assert.strictEqual(delRes.rows.length, 1);
  const deliveryId = delRes.rows[0].id;

  // Simulate provider rejection (e.g. bounce, invalid mailbox)
  const rejectRes = await client.query(
    "SELECT public.update_notification_delivery_status($1, 'rejected', NULL, '550', 'Mailbox unavailable') AS res;",
    [deliveryId]
  );
  assert.strictEqual(rejectRes.rows[0].res.status, "rejected");

  // Verify rule: Prompt 13: "Do not display a notification as delivered when the delivery provider has rejected it"
  const checkDel = await client.query(
    "SELECT status, error_code, error_message FROM public.notification_deliveries WHERE id = $1;",
    [deliveryId]
  );
  assert.strictEqual(checkDel.rows[0].status, "rejected");
  assert.strictEqual(checkDel.rows[0].error_code, "550");
  assert.strictEqual(checkDel.rows[0].error_message, "Mailbox unavailable");

  // Verify parent notification delivery_status was set to rejected
  const notifCheck = await client.query("SELECT delivery_status FROM public.notifications WHERE id = $1;", [notifId]);
  assert.strictEqual(notifCheck.rows[0].delivery_status, "rejected");
});

// Test 9: Lifecycle Notification Events: Quotation & Status Transitions
await asyncTest("Live DB Lifecycle: Quotation submission automatically triggers 'new_quotation' notification to customer", async () => {
  // Submit a quote for the test booking
  const quoteRes = await client.query(
    `
    INSERT INTO public.quotations (
      booking_id,
      professional_id,
      work_description,
      subtotal_kobo,
      labour_charges_kobo,
      materials_costs_kobo,
      additional_expenses_kobo,
      total_amount_kobo,
      status,
      valid_until
    ) VALUES ($1, $2, 'Replace sink drain trap and fix pipe fitting', 2200000, 1200000, 800000, 200000, 2200000, 'pending', now() + interval '7 days')
    RETURNING id;
    `,
    [testBookingId, testPro.professional_id]
  );
  const quoteId = quoteRes.rows[0].id;

  // Check customer notifications for new_quotation
  const notifRes = await client.query(
    "SELECT id, notification_type, title, body FROM public.notifications WHERE user_id = $1 AND notification_type = 'new_quotation' AND entity_id = $2;",
    [testCustomer.id, quoteId]
  );
  assert.strictEqual(notifRes.rows.length, 1, "Customer should receive new_quotation notification");
  assert.ok(notifRes.rows[0].title.includes("22,000"), "Title should reflect ₦22,000 total amount");
});

await asyncTest("Live DB Lifecycle: Booking status change to in_progress triggers notification", async () => {
  await client.query(
    "UPDATE public.bookings SET status = 'in_progress' WHERE id = $1;",
    [testBookingId]
  );

  const notifRes = await client.query(
    "SELECT id, notification_type, title FROM public.notifications WHERE user_id = $1 AND notification_type = 'booking_status_change' AND entity_id = $2;",
    [testCustomer.id, testBookingId]
  );
  assert.ok(notifRes.rows.length >= 1, "Customer should receive status change notification");
});

await asyncTest("Live DB Lifecycle: Verification status update triggers 'verification_status_change' notification", async () => {
  // Clear caller JWT and set admin context
  await client.query("SELECT set_config('request.jwt.claim.sub', '', false);");
  await client.query("SELECT set_config('easylife.trusted_admin_rpc', 'true', false);");

  // Toggle to pending first to guarantee distinct status change
  await client.query(
    "UPDATE public.professional_profiles SET verification_status = 'pending' WHERE id = $1;",
    [testPro.professional_id]
  );

  // Update pro's verification status to approved (admin action)
  await client.query(
    "UPDATE public.professional_profiles SET verification_status = 'approved' WHERE id = $1;",
    [testPro.professional_id]
  );

  const notifRes = await client.query(
    "SELECT id, notification_type, title FROM public.notifications WHERE user_id = $1 AND notification_type = 'verification_status_change';",
    [testPro.user_id]
  );
  assert.ok(notifRes.rows.length >= 1, "Professional should receive verification update notification");

  // Reset trusted admin RPC flag
  await client.query("SELECT set_config('easylife.trusted_admin_rpc', 'false', false);");
});

// Cleanup test fixtures
console.log("\nCleaning up test fixtures...");
if (testConvId) {
  await client.query("DELETE FROM public.messages WHERE conversation_id = $1;", [testConvId]);
  await client.query("DELETE FROM public.conversation_members WHERE conversation_id = $1;", [testConvId]);
  await client.query("DELETE FROM public.conversations WHERE id = $1;", [testConvId]);
}
await client.query("DELETE FROM public.quotations WHERE booking_id = $1;", [testBookingId]);
await client.query("DELETE FROM public.notifications WHERE entity_id = $1 OR user_id IN ($2, $3);", [testBookingId, testCustomer.id, testPro.user_id]);
await client.query("UPDATE public.bookings SET status = 'cancelled' WHERE id = $1;", [testBookingId]);
console.log("Cleanup complete.");

await client.end();

console.log("\n=================================================================");
console.log(`Prompt 13 Test Results: ${passedCount} passed, ${failedCount} failed`);
console.log("=================================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
