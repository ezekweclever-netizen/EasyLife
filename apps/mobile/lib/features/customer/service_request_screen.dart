import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../models/service_category.dart';
import '../../services/booking_service.dart';
import '../../shared/buttons.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';

class ServiceRequestScreen extends StatefulWidget {
  final ServiceCategory? preselectedCategory;
  final String? initialTitle;
  final String? initialDescription;
  final String? initialUrgency;

  const ServiceRequestScreen({
    super.key,
    this.preselectedCategory,
    this.initialTitle,
    this.initialDescription,
    this.initialUrgency,
  });

  @override
  State<ServiceRequestScreen> createState() => _ServiceRequestScreenState();
}

class _ServiceRequestScreenState extends State<ServiceRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _addressController = TextEditingController();
  final _bookingService = BookingService();

  List<ServiceCategory> _categories = [];
  ServiceCategory? _selectedCategory;
  String _selectedArea = AppConstants.portHarcourtAreas.first;
  String _urgency = 'normal';
  String _timeSlot = 'Morning (9:00 AM - 12:00 PM)';
  int _attachedPhotosCount = 0;
  bool _isLoading = false;
  bool _isInitLoading = true;

  @override
  void initState() {
    super.initState();
    _titleController.text = widget.initialTitle ?? '';
    _descController.text = widget.initialDescription ?? '';
    _urgency = widget.initialUrgency ?? 'normal';
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final cats = await _bookingService.fetchCategories();
    if (mounted) {
      setState(() {
        _categories = cats;
        if (widget.preselectedCategory != null) {
          _selectedCategory = cats.firstWhere(
            (c) => c.id == widget.preselectedCategory!.id,
            orElse: () => cats.isNotEmpty ? cats.first : widget.preselectedCategory!,
          );
        } else {
          _selectedCategory = cats.isNotEmpty ? cats.first : null;
        }
        _isInitLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) return;

    final user = SessionManager().currentUser;
    final customerId = user?.id ?? '00000000-0000-0000-0000-000000000001';

    setState(() => _isLoading = true);

    try {
      final fullAddress =
          '${_addressController.text.trim()}, $_selectedArea, Port Harcourt, Rivers State';

      final booking = await _bookingService.createBooking(
        customerId: customerId,
        categoryId: _selectedCategory!.id,
        title: _titleController.text,
        description: _descController.text,
        city: 'Port Harcourt',
        serviceAddress: fullAddress,
        preferredDate: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0],
        preferredTimeSlot: _timeSlot,
        urgency: _urgency,
      );

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text('Request Submitted!'),
            content: Text(
              'Your service request has been received with reference ${booking.referenceCode}. Verified artisans in Port Harcourt will review your request and submit itemized quotations.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('View Status'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting request: $e'),
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
        title: const Text('Book a Service'),
      ),
      body: _isInitLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Describe Your Service Need',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: EasyLifeColors.navy900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Provide clear details so verified professionals can provide accurate estimates.',
                        style: TextStyle(fontSize: 13, color: EasyLifeColors.charcoal600),
                      ),
                      const SizedBox(height: 20),

                      // Service Category Selector
                      const Text(
                        'Service Category',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: EasyLifeColors.charcoal800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<ServiceCategory>(
                        key: ValueKey(_selectedCategory?.id),
                        initialValue: _selectedCategory,
                        decoration: const InputDecoration(),
                        items: _categories.map((c) {
                          return DropdownMenuItem(
                            value: c,
                            child: Text(c.name),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _selectedCategory = v),
                      ),
                      const SizedBox(height: 16),

                      // Request Title
                      EasyTextField(
                        label: 'Problem Title',
                        hint: 'e.g. Master Bedroom Inverter AC leaking water',
                        controller: _titleController,
                        validator: (v) => v == null || v.trim().length < 5
                            ? 'Please provide a clear title'
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // Description
                      EasyTextField(
                        label: 'Detailed Description',
                        hint: 'Explain what happened, noises, error codes, or symptoms...',
                        controller: _descController,
                        maxLines: 4,
                        validator: (v) => v == null || v.trim().length < 10
                            ? 'Please provide at least 10 characters of detail'
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // Port Harcourt Area Selector
                      const Text(
                        'Port Harcourt Neighbourhood',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: EasyLifeColors.charcoal800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedArea,
                        decoration: const InputDecoration(),
                        items: AppConstants.portHarcourtAreas.map((area) {
                          return DropdownMenuItem(
                            value: area,
                            child: Text(area),
                          );
                        }).toList(),
                        onChanged: (v) => setState(() => _selectedArea = v ?? _selectedArea),
                      ),
                      const SizedBox(height: 16),

                      // Street Address
                      EasyTextField(
                        label: 'Street Address & Landmark',
                        hint: 'e.g. 14 Tombia Street, near Phase 2 Junction',
                        controller: _addressController,
                        prefixIcon: Icons.location_on_outlined,
                        validator: (v) => v == null || v.trim().isEmpty
                            ? 'Street address is required for dispatch'
                            : null,
                      ),
                      const SizedBox(height: 16),

                      // Preferred Time Slot
                      const Text(
                        'Preferred Arrival Window',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: EasyLifeColors.charcoal800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue: _timeSlot,
                        decoration: const InputDecoration(),
                        items: const [
                          DropdownMenuItem(
                            value: 'Morning (9:00 AM - 12:00 PM)',
                            child: Text('Morning (9:00 AM - 12:00 PM)'),
                          ),
                          DropdownMenuItem(
                            value: 'Afternoon (1:00 PM - 4:00 PM)',
                            child: Text('Afternoon (1:00 PM - 4:00 PM)'),
                          ),
                          DropdownMenuItem(
                            value: 'Evening (4:00 PM - 7:00 PM)',
                            child: Text('Evening (4:00 PM - 7:00 PM)'),
                          ),
                        ],
                        onChanged: (v) => setState(() => _timeSlot = v ?? _timeSlot),
                      ),
                      const SizedBox(height: 16),

                      // Urgency Level
                      const Text(
                        'Urgency Level',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: EasyLifeColors.charcoal800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _buildUrgencyChip('normal', 'Standard', Colors.grey),
                          const SizedBox(width: 8),
                          _buildUrgencyChip('high', 'High Priority', Colors.amber.shade800),
                          const SizedBox(width: 8),
                          _buildUrgencyChip('emergency', 'Emergency', Colors.red),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Photo / Evidence Upload Placeholder
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: EasyLifeColors.surfaceWhite,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: EasyLifeColors.borderGrey,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.add_a_photo_outlined,
                                color: EasyLifeColors.teal600, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Supporting Photos (Optional)',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: EasyLifeColors.navy900,
                                    ),
                                  ),
                                  Text(
                                    _attachedPhotosCount == 0
                                        ? 'Take or select photos of the fault'
                                        : '$_attachedPhotosCount photo(s) selected',
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
                                setState(() {
                                  _attachedPhotosCount = _attachedPhotosCount + 1;
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Photo attached ($_attachedPhotosCount)'),
                                    duration: const Duration(seconds: 1),
                                  ),
                                );
                              },
                              child: const Text('Add Photo'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 28),

                      EasyButton(
                        label: 'Submit Service Request',
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

  Widget _buildUrgencyChip(String value, String label, Color activeColor) {
    final isSelected = _urgency == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _urgency = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? activeColor.withValues(alpha: 0.12) : EasyLifeColors.surfaceWhite,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? activeColor : EasyLifeColors.borderGrey,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected ? activeColor : EasyLifeColors.charcoal700,
            ),
          ),
        ),
      ),
    );
  }
}
