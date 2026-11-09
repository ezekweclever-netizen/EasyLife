import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/notification_item.dart';
import '../../services/communication_service.dart';
import '../../shared/empty_view.dart';
import '../../theme/easylife_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _commService = CommunicationService();
  List<NotificationItem> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final user = SessionManager().currentUser;
    final userId = user?.id ?? 'current-user-1';
    final items = await _commService.fetchNotifications(userId);
    if (mounted) {
      setState(() {
        _notifications = items;
        _isLoading = false;
      });
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'new_quotation':
        return Icons.request_quote_outlined;
      case 'appointment_confirmed':
        return Icons.event_available_outlined;
      case 'system_alert':
        return Icons.shield_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const EmptyView(
                  icon: Icons.notifications_none,
                  title: 'No Notifications',
                  message: 'You have no new alerts or updates right now.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final n = _notifications[index];
                    return GestureDetector(
                      onTap: () {
                        if (!n.isRead) {
                          _commService.markAsRead(n.id);
                          setState(() {
                            _notifications[index] = NotificationItem(
                              id: n.id,
                              userId: n.userId,
                              title: n.title,
                              body: n.body,
                              notificationType: n.notificationType,
                              isRead: true,
                              createdAt: n.createdAt,
                            );
                          });
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: n.isRead
                              ? EasyLifeColors.surfaceWhite
                              : EasyLifeColors.teal50.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: n.isRead
                                ? EasyLifeColors.borderGrey
                                : EasyLifeColors.teal500.withValues(alpha: 0.5),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: n.isRead
                                    ? EasyLifeColors.surfaceMutedGrey
                                    : EasyLifeColors.teal50,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _getNotificationIcon(n.notificationType),
                                color: n.isRead
                                    ? EasyLifeColors.charcoal600
                                    : EasyLifeColors.teal600,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          n.title,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: n.isRead
                                                ? FontWeight.w600
                                                : FontWeight.bold,
                                            color: EasyLifeColors.navy900,
                                          ),
                                        ),
                                      ),
                                      if (!n.isRead)
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: EasyLifeColors.teal600,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    n.body,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: EasyLifeColors.charcoal700,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
