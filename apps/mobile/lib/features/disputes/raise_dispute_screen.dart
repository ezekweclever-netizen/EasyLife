import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/booking.dart';
import '../../services/dispute_service.dart';
import '../../shared/buttons.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';

class RaiseDisputeScreen extends StatefulWidget {
  final Booking booking;

  const RaiseDisputeScreen({super.key, required this.booking});

  @override
  State<RaiseDisputeScreen> createState() => _RaiseDisputeScreenState();
}

class _RaiseDisputeScreenState extends State<RaiseDisputeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descController = TextEditingController();
  final _disputeService = DisputeService();

  final List<String> _disputeCategories = [
    'Incomplete work',
    'Poor workmanship',
    'Unapproved additional charges',
    'Missed appointments',
    'Property damage',
    'Other service-related problems',
  ];

  late String _selectedCategory;
  int _photosAttached = 0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _selectedCategory = _disputeCategories.first;
  }

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final user = SessionManager().currentUser;
    final openedById = user?.id ?? widget.booking.customerId;
    final againstId = widget.booking.professionalId ?? 'pro-1';

    setState(() => _isLoading = true);

    try {
      final dispute = await _disputeService.createDispute(
        bookingId: widget.booking.id,
        openedByUserId: openedById,
        againstUserId: againstId,
        category: _selectedCategory,
        description: _descController.text,
      );

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text('Dispute Case Registered'),
            content: Text(
              'Case reference ${dispute.referenceCode} has been logged under investigation. Escrow payout is immediately frozen until an administrator reviews the evidence.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('Understood'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit dispute: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Service Dispute'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Service Dispute & Accountability',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.navy900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Reporting an issue on booking ${widget.booking.referenceCode}. Escrow funds will remain safely held while an administrator reviews your case.',
                  style: const TextStyle(
                    fontSize: 13,
                    color: EasyLifeColors.charcoal600,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),

                // Escrow Protection Alert Box
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: EasyLifeColors.warningBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.amber.shade300),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.shield_outlined,
                          color: EasyLifeColors.warningText, size: 24),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'A disputed booking does not automatically become a completed transaction. Payout is safeguarded.',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: EasyLifeColors.warningText,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                const Text(
                  'Dispute Category',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: EasyLifeColors.charcoal800,
                  ),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: _selectedCategory,
                  decoration: const InputDecoration(),
                  items: _disputeCategories.map((c) {
                    return DropdownMenuItem(value: c, child: Text(c));
                  }).toList(),
                  onChanged: (v) =>
                      setState(() => _selectedCategory = v ?? _selectedCategory),
                ),
                const SizedBox(height: 16),

                EasyTextField(
                  label: 'Describe the Problem in Detail',
                  hint:
                      'Explain specifically what was left incomplete, poor workmanship observed, or unapproved charges requested...',
                  controller: _descController,
                  maxLines: 4,
                  validator: (v) => v == null || v.trim().length < 15
                      ? 'Please provide at least 15 characters of detail'
                      : null,
                ),
                const SizedBox(height: 20),

                // Evidence Uploads
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: EasyLifeColors.surfaceWhite,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: EasyLifeColors.borderGrey),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.photo_library_outlined,
                          color: EasyLifeColors.teal600, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Photographic Evidence',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              _photosAttached == 0
                                  ? 'Attach photos of defective work or invoices'
                                  : '$_photosAttached photo(s) attached',
                              style: const TextStyle(
                                fontSize: 11,
                                color: EasyLifeColors.charcoal500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          setState(() => _photosAttached = _photosAttached + 1);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Evidence photo attached ($_photosAttached)'),
                              duration: const Duration(seconds: 1),
                            ),
                          );
                        },
                        child: const Text('Upload Photo'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                EasyButton(
                  label: 'Open Dispute Case',
                  backgroundColor: Colors.red.shade700,
                  isLoading: _isLoading,
                  onPressed: _handleSubmit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
