import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../shared/buttons.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';

class ProQuotationScreen extends StatefulWidget {
  final Booking booking;

  const ProQuotationScreen({super.key, required this.booking});

  @override
  State<ProQuotationScreen> createState() => _ProQuotationScreenState();
}

class _ProQuotationScreenState extends State<ProQuotationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _labourController = TextEditingController();
  final _materialsController = TextEditingController();
  final _expensesController = TextEditingController();
  final _durationController = TextEditingController(text: '120');
  final _descController = TextEditingController();
  final _bookingService = BookingService();

  bool _isLoading = false;

  double get _totalNaira {
    final labour = double.tryParse(_labourController.text) ?? 0.0;
    final materials = double.tryParse(_materialsController.text) ?? 0.0;
    final expenses = double.tryParse(_expensesController.text) ?? 0.0;
    return labour + materials + expenses;
  }

  @override
  void dispose() {
    _labourController.dispose();
    _materialsController.dispose();
    _expensesController.dispose();
    _durationController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_totalNaira <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter at least one valid charge amount.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final user = SessionManager().currentUser;
    final proId = user?.id ?? 'pro-1';

    setState(() => _isLoading = true);

    try {
      await _bookingService.submitQuotation(
        bookingId: widget.booking.id,
        professionalId: proId,
        labourAmountNaira: double.tryParse(_labourController.text) ?? 0.0,
        materialsAmountNaira: double.tryParse(_materialsController.text) ?? 0.0,
        additionalExpensesNaira: double.tryParse(_expensesController.text) ?? 0.0,
        estimatedDurationMinutes: int.tryParse(_durationController.text),
        workDescription: _descController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Itemized quotation submitted to customer!'),
            backgroundColor: EasyLifeColors.teal600,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit quote: $e'),
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
        title: const Text('Prepare Quotation'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.booking.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.navy900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Job Ref: ${widget.booking.referenceCode} • ${widget.booking.serviceAddress}',
                  style: const TextStyle(fontSize: 12, color: EasyLifeColors.charcoal600),
                ),
                const SizedBox(height: 20),

                // Itemized Breakdown Fields
                const Text(
                  'Itemized Cost Breakdown (NGN)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.navy900,
                  ),
                ),
                const SizedBox(height: 12),

                EasyTextField(
                  label: 'Labour Charges (₦)',
                  hint: 'e.g. 15000',
                  controller: _labourController,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                ),
                const SizedBox(height: 14),

                EasyTextField(
                  label: 'Materials & Spare Parts (₦)',
                  hint: 'e.g. 8500',
                  controller: _materialsController,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 14),

                EasyTextField(
                  label: 'Logistics / Additional Expenses (₦)',
                  hint: 'e.g. 2000',
                  controller: _expensesController,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 14),

                EasyTextField(
                  label: 'Estimated Duration (Minutes)',
                  hint: 'e.g. 90',
                  controller: _durationController,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 14),

                EasyTextField(
                  label: 'Scope of Proposed Work',
                  hint:
                      'Describe the repair steps, parts to replace, and testing procedure...',
                  controller: _descController,
                  maxLines: 3,
                  validator: (v) => v == null || v.trim().length < 5 ? 'Required' : null,
                ),
                const SizedBox(height: 24),

                // Total Summary Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: EasyLifeColors.teal50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: EasyLifeColors.teal500.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Quotation',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: EasyLifeColors.charcoal700,
                            ),
                          ),
                          Text(
                            'Payable via Escrow upon completion',
                            style: TextStyle(
                              fontSize: 10,
                              color: EasyLifeColors.charcoal500,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '₦${_totalNaira.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: EasyLifeColors.teal800,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                EasyButton(
                  label: 'Submit Quotation to Customer',
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
