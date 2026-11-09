import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/message.dart';
import '../models/notification_item.dart';
import 'supabase_service.dart';

class CommunicationService {
  final SupabaseClient _client = SupabaseService.client;

  /// Fetch messages for a booking
  Future<List<ChatMessage>> fetchMessages(String bookingId) async {
    try {
      final res = await _client
          .from('messages')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', ascending: true);

      if (res.isNotEmpty) {
        return res.map((item) => ChatMessage.fromJson(item)).toList();
      }
    } catch (e) {
      // Return sample conversation
    }

    return [
      ChatMessage(
        id: 'msg-1',
        bookingId: bookingId,
        senderUserId: 'pro-user-1',
        recipientUserId: 'cust-user-1',
        content: 'Hello! I have reviewed your request and I am en route to your location in GRA Phase 2.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 45)).toIso8601String(),
        isRead: true,
      ),
      ChatMessage(
        id: 'msg-2',
        bookingId: bookingId,
        senderUserId: 'cust-user-1',
        recipientUserId: 'pro-user-1',
        content: 'Understood. Please call me when you reach the security gate.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 30)).toIso8601String(),
        isRead: true,
      ),
      ChatMessage(
        id: 'msg-3',
        bookingId: bookingId,
        senderUserId: 'pro-user-1',
        recipientUserId: 'cust-user-1',
        content: 'Arrived at the gate now.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
        isRead: false,
      ),
    ];
  }

  /// Send message
  Future<ChatMessage> sendMessage({
    required String bookingId,
    required String senderUserId,
    required String recipientUserId,
    required String content,
  }) async {
    final payload = {
      'booking_id': bookingId,
      'sender_user_id': senderUserId,
      'recipient_user_id': recipientUserId,
      'content': content.trim(),
      'is_read': false,
      'created_at': DateTime.now().toIso8601String(),
    };

    try {
      final res = await _client.from('messages').insert(payload).select().single();
      return ChatMessage.fromJson(res);
    } catch (e) {
      return ChatMessage(
        id: 'msg-local-${DateTime.now().millisecondsSinceEpoch}',
        bookingId: bookingId,
        senderUserId: senderUserId,
        recipientUserId: recipientUserId,
        content: content,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  /// Fetch notifications
  Future<List<NotificationItem>> fetchNotifications(String userId) async {
    try {
      final res = await _client
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(25);

      if (res.isNotEmpty) {
        return res.map((item) => NotificationItem.fromJson(item)).toList();
      }
    } catch (e) {
      // Fallback
    }

    return [
      NotificationItem(
        id: 'notif-1',
        userId: userId,
        title: 'New Quotation Received',
        body: 'Apex Electrics submitted a quotation of ₦18,500 for your booking.',
        notificationType: 'new_quotation',
        isRead: false,
        createdAt: DateTime.now().subtract(const Duration(hours: 1)).toIso8601String(),
      ),
      NotificationItem(
        id: 'notif-2',
        userId: userId,
        title: 'Appointment Confirmed',
        body: 'Your AC technician appointment is scheduled for tomorrow at 10:00 AM.',
        notificationType: 'appointment_confirmed',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
      ),
      NotificationItem(
        id: 'notif-3',
        userId: userId,
        title: 'Job Completion Pin Reminder',
        body: 'Never share your 4-digit completion PIN until work has been fully inspected.',
        notificationType: 'system_alert',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
      ),
    ];
  }

  /// Mark notification read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _client.from('notifications').update({'is_read': true}).eq('id', notificationId);
    } catch (e) {
      // Ignored
    }
  }
}
