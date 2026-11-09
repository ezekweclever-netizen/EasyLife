class ChatMessage {
  final String id;
  final String bookingId;
  final String senderUserId;
  final String recipientUserId;
  final String content;
  final String createdAt;
  final bool isRead;

  const ChatMessage({
    required this.id,
    required this.bookingId,
    required this.senderUserId,
    required this.recipientUserId,
    required this.content,
    required this.createdAt,
    this.isRead = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id']?.toString() ?? '',
      bookingId: json['booking_id']?.toString() ?? '',
      senderUserId: json['sender_user_id']?.toString() ?? '',
      recipientUserId: json['recipient_user_id']?.toString() ?? '',
      content: json['content']?.toString() ?? '',
      createdAt: json['created_at']?.toString() ?? '',
      isRead: json['is_read'] == true,
    );
  }
}
