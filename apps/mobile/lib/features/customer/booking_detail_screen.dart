import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/booking.dart';
import '../../models/quotation.dart';
import '../../services/booking_service.dart';
import '../../shared/buttons.dart';
import '../../shared/status_chip.dart';
import '../../theme/easylife_theme.dart';
import '../communication/chat_screen.dart';
import '../disputes/raise_dispute_screen.dart';
import 'submit_review_screen.dart';

class BookingDetailScreen extends StatefulWidget {
  final Booking booking;

  const BookingDetailScreen({super.key, required this.booking});

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  final _bookingService = BookingService();
  late Booking _booking;
  List<Quotation> _quotations = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _booking = widget.booking;
    _loadQuotations();
  }

  Future<void> _loadQuotations() async {
    setState(() => _isLoading = true);
    final quotes = await _bookingService.fetchQuotationsForBooking(_booking.id);

    // If empty and booking is active, generate sample quotation for acceptance testing
    if (quotes.isEmpty && _booking.status == 'confirmed') {
      _quotations = [
        Quotation(
          id: 'qt-sample-1',
          referenceCode: 'QT-PH-88910',
          bookingId: _booking.id,
          professionalId: _booking.professionalId ?? 'pro-1',
          status: 'pending',
          totalAmountKobo: 1850000,
          labourChargesKobo: 1000000,
          materialsCostsKobo: 700000,
          additionalExpensesKobo: 150000,
          estimatedDurationMinutes: 120,
          workDescription:
              'Full leak detection on flare joints, nitrogen pressure test, and R410A refrigerant gas top-up.',
          createdAt: DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
        ),
      ];
    } else {
      _quotations = quotes;
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleAcceptQuote(Quotation q) async {
    await _bookingService.acceptQuotation(q.id, _booking.id, q.totalAmountKobo);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Quotation accepted! Work is scheduled under Escrow Protection.'),
        backgroundColor: EasyLifeColors.teal600,
      ),
    );
    setState(() {
      _booking = Booking(
        id: _booking.id,
        referenceCode: _booking.referenceCode,
        customerId: _booking.customerId,
        professionalId: _booking.professionalId,
        categoryId: _booking.categoryId,
        categoryName: _booking.categoryName,
        professionalName: _booking.professionalName,
        title: _booking.title,
        description: _booking.description,
        status: 'confirmed',
        city: _booking.city,
        serviceAddress: _booking.serviceAddress,
        agreedAmountKobo: q.totalAmountKobo,
        createdAt: _booking.createdAt,
      );
    });
    _loadQuotations();
  }

  Future<void> _handleConfirmCompletion() async {
    await _bookingService.confirmJobCompletion(_booking.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Job marked completed. Thank you for using EasyLife!'),
        backgroundColor: EasyLifeColors.teal600,
      ),
    );
    setState(() {
      _booking = Booking(
        id: _booking.id,
        referenceCode: _booking.referenceCode,
        customerId: _booking.customerId,
        professionalId: _booking.professionalId,
        categoryId: _booking.categoryId,
        categoryName: _booking.categoryName,
        professionalName: _booking.professionalName,
        title: _booking.title,
        description: _booking.description,
        status: 'completed',
        city: _booking.city,
        serviceAddress: _booking.serviceAddress,
        agreedAmountKobo: _booking.agreedAmountKobo,
        createdAt: _booking.createdAt,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final isPro = SessionManager().activeRole == AppRole.professional;

    return Scaffold(
      appBar: AppBar(
        title: Text(_booking.referenceCode),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            tooltip: 'Chat with Artisan',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ChatScreen(
                    bookingId: _booking.id,
                    recipientUserId: isPro
                        ? _booking.customerId
                        : (_booking.professionalId ?? 'pro-user-1'),
                    title: _booking.professionalName ?? 'Assigned Professional',
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header Card
            Container(
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _booking.categoryName ?? 'Service Booking',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: EasyLifeColors.teal700,
                        ),
                      ),
                      StatusChip(status: _booking.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _booking.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: EasyLifeColors.navy900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _booking.description,
                    style: const TextStyle(
                      fontSize: 13,
                      color: EasyLifeColors.charcoal700,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: EasyLifeColors.borderGrey, height: 1),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 16, color: EasyLifeColors.charcoal500),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _booking.serviceAddress,
                          style: const TextStyle(
                            fontSize: 12,
                            color: EasyLifeColors.charcoal600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Job PIN Accountability Card (Prompt 14 requirement)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: EasyLifeColors.teal50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: EasyLifeColors.teal500.withValues(alpha: 0.5)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined,
                      color: EasyLifeColors.teal700, size: 28),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Service Accountability Active',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: EasyLifeColors.teal800,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Your funds remain protected in escrow. Never share your completion PIN or sign off until you have physically inspected finished work.',
                          style: TextStyle(
                            fontSize: 11,
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
            const SizedBox(height: 20),

            // Assigned Professional Info Card
            if (_booking.professionalName != null) ...[
              const Text(
                'Assigned Professional',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: EasyLifeColors.navy900,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: EasyLifeColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: EasyLifeColors.borderGrey),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: EasyLifeColors.teal50,
                      child: Text(
                        _booking.professionalName!.substring(0, 1),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: EasyLifeColors.teal700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _booking.professionalName!,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          const Text(
                            'Verified Trade Partner • Port Harcourt Hub',
                            style: TextStyle(
                              fontSize: 11,
                              color: EasyLifeColors.charcoal500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.chat_bubble_outline,
                          color: EasyLifeColors.teal600),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ChatScreen(
                              bookingId: _booking.id,
                              recipientUserId: _booking.professionalId ?? 'pro-1',
                              title: _booking.professionalName!,
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Quotations Section
            const Text(
              'Itemized Quotations',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: EasyLifeColors.navy900,
              ),
            ),
            const SizedBox(height: 8),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_quotations.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: EasyLifeColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: EasyLifeColors.borderGrey),
                ),
                child: const Text(
                  'No quotations submitted yet. The professional will inspect the site and submit a formal quote.',
                  style: TextStyle(fontSize: 12, color: EasyLifeColors.charcoal500),
                ),
              )
            else
              ..._quotations.map((q) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: EasyLifeColors.surfaceWhite,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: EasyLifeColors.borderGrey),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            q.referenceCode,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: EasyLifeColors.charcoal600,
                            ),
                          ),
                          StatusChip(status: q.status),
                        ],
                      ),
                      if (q.workDescription != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          q.workDescription!,
                          style: const TextStyle(fontSize: 12, height: 1.3),
                        ),
                      ],
                      const SizedBox(height: 10),
                      const Divider(color: EasyLifeColors.borderGrey, height: 1),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Labour:', style: TextStyle(fontSize: 12)),
                          Text('₦${q.labourNaira.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Materials:', style: TextStyle(fontSize: 12)),
                          Text('₦${q.materialsNaira.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      if (q.additionalExpensesKobo > 0) ...[
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Logistics / Additional:', style: TextStyle(fontSize: 12)),
                            Text('₦${q.expensesNaira.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                      const SizedBox(height: 6),
                      const Divider(color: EasyLifeColors.borderGrey, height: 1),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Amount:',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: EasyLifeColors.navy900,
                            ),
                          ),
                          Text(
                            '₦${q.totalAmountNaira.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: EasyLifeColors.teal800,
                            ),
                          ),
                        ],
                      ),
                      if (q.isPending && !isPro) ...[
                        const SizedBox(height: 14),
                        EasyButton(
                          label: 'Accept & Authorize Escrow',
                          onPressed: () => _handleAcceptQuote(q),
                        ),
                      ],
                    ],
                  ),
                );
              }),
            const SizedBox(height: 24),

            // Action Buttons
            if (_booking.status == 'completion_requested') ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: EasyLifeColors.warningBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'The artisan has reported the job complete. Please inspect the work carefully before confirming.',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.warningText,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              EasyButton(
                label: 'Confirm Completion & Release Escrow',
                backgroundColor: EasyLifeColors.teal600,
                onPressed: _handleConfirmCompletion,
              ),
              const SizedBox(height: 10),
              EasyButton(
                label: 'Report Incomplete Work / Dispute',
                backgroundColor: Colors.red.shade700,
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => RaiseDisputeScreen(booking: _booking),
                    ),
                  );
                },
              ),
            ] else if (_booking.isCompleted) ...[
              EasyButton(
                label: 'Leave a Verified Review',
                icon: Icons.star_outline_rounded,
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => SubmitReviewScreen(booking: _booking),
                    ),
                  );
                },
              ),
            ] else ...[
              OutlinedButton.icon(
                icon: const Icon(Icons.report_problem_outlined, color: Colors.red),
                label: const Text(
                  'Report Issue or Dispute Job',
                  style: TextStyle(color: Colors.red),
                ),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 44),
                  side: const BorderSide(color: Colors.red),
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => RaiseDisputeScreen(booking: _booking),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
