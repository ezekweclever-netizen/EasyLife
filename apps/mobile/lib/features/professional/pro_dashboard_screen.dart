import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../shared/status_chip.dart';
import '../../theme/easylife_theme.dart';
import '../../shared/logo.dart';
import '../customer/booking_detail_screen.dart';
import 'pro_quotation_screen.dart';

class ProDashboardScreen extends StatefulWidget {
  const ProDashboardScreen({super.key});

  @override
  State<ProDashboardScreen> createState() => _ProDashboardScreenState();
}

class _ProDashboardScreenState extends State<ProDashboardScreen> {
  final _bookingService = BookingService();
  List<Booking> _jobs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    setState(() => _isLoading = true);
    final user = SessionManager().currentUser;
    final items = await _bookingService.fetchProfessionalJobs(user?.id);

    if (items.isEmpty) {
      _jobs = [
        Booking(
          id: 'pro-job-1',
          referenceCode: 'BK-PH-99214',
          customerId: 'cust-1',
          categoryId: '10000000-0000-4000-8000-000000000003',
          categoryName: 'Air Conditioning & Cooling',
          title: 'Split AC Gas Top-up & Coil Service',
          description: 'AC in master bedroom stopped cooling. Urgent assistance needed.',
          status: 'confirmed',
          city: 'Port Harcourt',
          serviceAddress: '12 Tombia St, GRA Phase 2',
          agreedAmountKobo: 2200000, // ₦22,000
          createdAt: DateTime.now().subtract(const Duration(hours: 3)).toIso8601String(),
        ),
        Booking(
          id: 'pro-job-2',
          referenceCode: 'BK-PH-44109',
          customerId: 'cust-2',
          categoryId: '10000000-0000-4000-8000-000000000004',
          categoryName: 'Generators & Power Systems',
          title: 'Generator Starts and Shuts Down After 5 Mins',
          description: 'Perkins 15kVA shutting down under load. Needs urgent diagnostic.',
          status: 'draft',
          city: 'Port Harcourt',
          serviceAddress: 'Peter Odili Road, Trans-Amadi Link',
          createdAt: DateTime.now().subtract(const Duration(hours: 1)).toIso8601String(),
        ),
      ];
    } else {
      _jobs = items;
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = SessionManager().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const EasyLifeBrandLockup(
          size: 28,
          isDark: true,
          showSlogan: true,
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
              child: Text(
                'Artisan Hub',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadJobs,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Professional Status Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [EasyLifeColors.navy950, EasyLifeColors.navy800],
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                user?.fullName ?? 'Verified Professional',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: EasyLifeColors.teal600,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.verified, size: 12, color: Colors.white),
                                    SizedBox(width: 4),
                                    Text(
                                      'VERIFIED',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const Divider(color: Colors.white24, height: 1),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _buildMetric('Available Leads', '${_jobs.length}'),
                              _buildMetric('Completed', '28'),
                              _buildMetric('Rating', '4.9 ★'),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Active Jobs & Leads Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Assigned Jobs & Leads',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: EasyLifeColors.navy900,
                          ),
                        ),
                        Text(
                          '${_jobs.length} Active',
                          style: const TextStyle(
                            fontSize: 13,
                            color: EasyLifeColors.teal700,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Job Cards List
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _jobs.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final job = _jobs[index];
                        final isDraftLead = job.status == 'draft';

                        return Container(
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
                                    job.referenceCode,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: EasyLifeColors.teal700,
                                    ),
                                  ),
                                  StatusChip(status: job.status),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                job.title,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: EasyLifeColors.navy900,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                job.description,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: EasyLifeColors.charcoal700,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.location_on_outlined,
                                      size: 14, color: EasyLifeColors.charcoal500),
                                  const SizedBox(width: 4),
                                  Text(
                                    job.serviceAddress,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: EasyLifeColors.charcoal600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Divider(
                                  color: EasyLifeColors.borderGrey, height: 1),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    job.agreedAmountNaira != null
                                        ? '₦${job.agreedAmountNaira!.toStringAsFixed(0)}'
                                        : 'Awaiting Quote',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: EasyLifeColors.teal800,
                                    ),
                                  ),
                                  if (isDraftLead)
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 14, vertical: 8),
                                        minimumSize: const Size(0, 36),
                                      ),
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                ProQuotationScreen(booking: job),
                                          ),
                                        ).then((_) => _loadJobs());
                                      },
                                      child: const Text('Submit Quote'),
                                    )
                                  else
                                    OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 14, vertical: 8),
                                        minimumSize: const Size(0, 36),
                                      ),
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                BookingDetailScreen(booking: job),
                                          ),
                                        ).then((_) => _loadJobs());
                                      },
                                      child: const Text('Manage Job'),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMetric(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
