import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/message.dart';
import '../../services/communication_service.dart';
import '../../theme/easylife_theme.dart';

class ChatScreen extends StatefulWidget {
  final String bookingId;
  final String recipientUserId;
  final String title;

  const ChatScreen({
    super.key,
    required this.bookingId,
    required this.recipientUserId,
    required this.title,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _communicationService = CommunicationService();
  List<ChatMessage> _messages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    final msgs = await _communicationService.fetchMessages(widget.bookingId);
    if (mounted) {
      setState(() {
        _messages = msgs;
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSend() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    final user = SessionManager().currentUser;
    final senderId = user?.id ?? 'current-user-1';

    final sent = await _communicationService.sendMessage(
      bookingId: widget.bookingId,
      senderUserId: senderId,
      recipientUserId: widget.recipientUserId,
      content: text,
    );

    setState(() {
      _messages.add(sent);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = SessionManager().currentUser;
    final currentUserId = user?.id ?? 'current-user-1';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Text(
              'Encrypted in-app communication',
              style: TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Escrow & Security Advice Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: EasyLifeColors.teal50,
            child: const Row(
              children: [
                Icon(Icons.security, size: 16, color: EasyLifeColors.teal700),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Keep all discussions in-app to protect your dispute and guarantee coverage.',
                    style: TextStyle(fontSize: 11, color: EasyLifeColors.teal800),
                  ),
                ),
              ],
            ),
          ),

          // Messages List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final m = _messages[index];
                      final isMine = m.senderUserId == currentUserId ||
                          m.senderUserId == 'cust-user-1';

                      return Align(
                        alignment: isMine
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.75,
                          ),
                          decoration: BoxDecoration(
                            color: isMine
                                ? EasyLifeColors.teal600
                                : EasyLifeColors.surfaceWhite,
                            borderRadius: BorderRadius.circular(14),
                            border: isMine
                                ? null
                                : Border.all(color: EasyLifeColors.borderGrey),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            m.content,
                            style: TextStyle(
                              color: isMine ? Colors.white : EasyLifeColors.navy900,
                              fontSize: 14,
                              height: 1.3,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: EasyLifeColors.surfaceWhite,
              border: Border(
                top: BorderSide(color: EasyLifeColors.borderGrey),
              ),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide:
                              const BorderSide(color: EasyLifeColors.borderGrey),
                        ),
                      ),
                      onSubmitted: (_) => _handleSend(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.send_rounded,
                        color: EasyLifeColors.teal600),
                    onPressed: _handleSend,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
