import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../shared/empty_view.dart';
import '../../shared/status_chip.dart';
import '../../theme/easylife_theme.dart';
import 'booking_detail_screen.dart';
import 'service_request_screen.dart';

class CustomerBookingsScreen extends StatefulWidget {
  const CustomerBookingsScreen({super.key});

  @override
  State<CustomerBookingsScreen> createState() => _CustomerBookingsScreenState();
}

class _CustomerBookingsScreenState extends State<CustomerBookingsScreen> {
  final _bookingService = BookingService();
  List<Booking> _bookings = [];
  bool _isLoading = true;
  String _activeFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => _isLoading = true);
    final user = SessionManager().currentUser;
    final customerId = user?.id ?? '00000000-0000-0000-0000-000000000001';
    final items = await _bookingService.fetchCustomerBookings(customerId);

    // If empty, provide sample bookings for instant testing
    if (items.isEmpty) {
      _bookings = [
        Booking(
          id: 'bk-demo-1',
          referenceCode: 'BK-PH-884129',
          customerId: customerId,
          categoryId: '10000000-0000-4000-8000-000000000003',
          categoryName: 'Air Conditioning & Cooling',
          professionalName: 'Port Harcourt CoolBreeze ACs',
          title: 'Master Bedroom Inverter AC Diagnostic',
          description: 'AC blowing warm air, outdoor unit noisy.',
          urgency: 'high',
          status: 'confirmed',
          city: 'Port Harcourt',
          serviceAddress: '14 Tombia Street, GRA Phase 2',
          preferredDate: '2026-11-10',
          preferredTimeSlot: 'Morning (9:00 AM - 12:00 PM)',
          agreedAmountKobo: 1850000, // ₦18,500
          createdAt: DateTime.now().subtract(const Duration(hours: 4)).toIso8601String(),
        ),
        Booking(
          id: 'bk-demo-2',
          referenceCode: 'BK-PH-771920',
          customerId: customerId,
          categoryId: '10000000-0000-4000-8000-000000000001',
          categoryName: 'Plumbing & Water Systems',
          professionalName: 'Delta Flow Plumbing Systems',
          title: 'Kitchen Sink Tap & Overhead Tank Line Repair',
          description: 'Low water pressure and pipe joint leak.',
          urgency: 'normal',
          status: 'completed',
          city: 'Port Harcourt',
          serviceAddress: 'Peter Odili Road, PH',
          agreedAmountKobo: 1200000,
          customerConfirmedAt: '2026-11-05T12:00:00Z',
          createdAt: DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
        ),
      ];
    } else {
      _bookings = items;
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _bookings.where((b) {
      if (_activeFilter == 'active') {
        return b.status == 'confirmed' ||
            b.status == 'in_progress' ||
            b.status == 'completion_requested';
      }
      if (_activeFilter == 'completed') return b.status == 'completed';
      if (_activeFilter == 'disputed') return b.status == 'disputed';
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Service Bookings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'New Request',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ServiceRequestScreen()),
              ).then((_) => _loadBookings());
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            color: EasyLifeColors.surfaceWhite,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _buildFilterChip('all', 'All (${_bookings.length})'),
                const SizedBox(width: 8),
                _buildFilterChip('active', 'Active'),
                const SizedBox(width: 8),
                _buildFilterChip('completed', 'Completed'),
                const SizedBox(width: 8),
                _buildFilterChip('disputed', 'Disputed'),
              ],
            ),
          ),
          const Divider(height: 1, color: EasyLifeColors.borderGrey),

          // Bookings List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? EmptyView(
                        icon: Icons.calendar_today_outlined,
                        title: 'No Bookings Found',
                        message: 'You have no service bookings under this filter.',
                        buttonLabel: 'Book a Service Now',
                        onButtonPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ServiceRequestScreen(),
                            ),
                          ).then((_) => _loadBookings());
                        },
                      )
                    : RefreshIndicator(
                        onRefresh: _loadBookings,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final b = filtered[index];
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => BookingDetailScreen(booking: b),
                                  ),
                                ).then((_) => _loadBookings());
                              },
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: EasyLifeColors.surfaceWhite,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: EasyLifeColors.borderGrey),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          b.referenceCode,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: EasyLifeColors.teal700,
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                        StatusChip(status: b.status),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      b.title,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: EasyLifeColors.navy900,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      b.serviceAddress,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: EasyLifeColors.charcoal600,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    const Divider(
                                      color: EasyLifeColors.borderGrey,
                                      height: 1,
                                    ),
                                    const SizedBox(height: 10),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(
                                              Icons.access_time,
                                              size: 14,
                                              color: EasyLifeColors.charcoal500,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              b.preferredDate ?? 'Date as agreed',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: EasyLifeColors.charcoal600,
                                              ),
                                            ),
                                          ],
                                        ),
                                        Text(
                                          b.agreedAmountNaira != null
                                              ? '₦${b.agreedAmountNaira!.toStringAsFixed(0)}'
                                              : 'Quote Pending',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: b.agreedAmountNaira != null
                                                ? EasyLifeColors.teal800
                                                : EasyLifeColors.charcoal500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _activeFilter == key;
    return GestureDetector(
      onTap: () => setState(() => _activeFilter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? EasyLifeColors.navy900 : EasyLifeColors.surfaceMutedGrey,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : EasyLifeColors.charcoal700,
          ),
        ),
      ),
    );
  }
}
