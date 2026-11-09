import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/booking.dart';
import '../../services/dispute_service.dart';
import '../../shared/buttons.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';

class SubmitReviewScreen extends StatefulWidget {
  final Booking booking;

  const SubmitReviewScreen({super.key, required this.booking});

  @override
  State<SubmitReviewScreen> createState() => _SubmitReviewScreenState();
}

class _SubmitReviewScreenState extends State<SubmitReviewScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _commentController = TextEditingController();
  final _disputeService = DisputeService();

  int _rating = 5;
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final user = SessionManager().currentUser;
    final reviewerId = user?.id ?? widget.booking.customerId;

    setState(() => _isLoading = true);

    try {
      await _disputeService.submitReview(
        bookingId: widget.booking.id,
        reviewerUserId: reviewerId,
        professionalId: widget.booking.professionalId ?? 'pro-1',
        rating: _rating,
        title: _titleController.text,
        comment: _commentController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Thank you! Your verified review has been submitted.'),
            backgroundColor: EasyLifeColors.teal600,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting review: $e'),
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
        title: const Text('Review Service'),
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
                  'Rate ${widget.booking.professionalName ?? "Service"}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.navy900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'For completed job: ${widget.booking.referenceCode}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: EasyLifeColors.charcoal600,
                  ),
                ),
                const SizedBox(height: 24),

                // Star Rating Selector
                Center(
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          final starIndex = index + 1;
                          return IconButton(
                            iconSize: 40,
                            icon: Icon(
                              starIndex <= _rating
                                  ? Icons.star_rounded
                                  : Icons.star_outline_rounded,
                              color: Colors.amber,
                            ),
                            onPressed: () => setState(() => _rating = starIndex),
                          );
                        }),
                      ),
                      Text(
                        _getRatingLabel(_rating),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: EasyLifeColors.teal800,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                EasyTextField(
                  label: 'Review Title',
                  hint: 'e.g. Excellent AC repair in GRA Phase 2',
                  controller: _titleController,
                  validator: (v) => v == null || v.trim().length < 3
                      ? 'Please enter a review headline'
                      : null,
                ),
                const SizedBox(height: 16),

                EasyTextField(
                  label: 'Detailed Feedback',
                  hint:
                      'Describe punctuality, quality of workmanship, transparency, and attitude...',
                  controller: _commentController,
                  maxLines: 4,
                  validator: (v) => v == null || v.trim().length < 10
                      ? 'Please provide at least 10 characters'
                      : null,
                ),
                const SizedBox(height: 24),

                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: EasyLifeColors.surfaceMutedGrey,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.verified, color: EasyLifeColors.teal600, size: 18),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Verified Review: Tied to your completed booking to prevent manipulation.',
                          style: TextStyle(
                            fontSize: 11,
                            color: EasyLifeColors.charcoal700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                EasyButton(
                  label: 'Submit Review',
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

  String _getRatingLabel(int rating) {
    switch (rating) {
      case 5:
        return '5 Stars • Excellent Work';
      case 4:
        return '4 Stars • Very Good';
      case 3:
        return '3 Stars • Average';
      case 2:
        return '2 Stars • Poor Workmanship';
      case 1:
      default:
        return '1 Star • Very Unsatisfactory';
    }
  }
}
