import 'dart:math';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/constants.dart';
import '../models/service_category.dart';
import '../models/professional_profile.dart';
import '../models/booking.dart';
import '../models/quotation.dart';
import 'supabase_service.dart';

class BookingService {
  final SupabaseClient _client = SupabaseService.client;

  /// Fetch active service categories
  Future<List<ServiceCategory>> fetchCategories() async {
    try {
      final res = await _client
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', ascending: true);

      if (res.isNotEmpty) {
        return res.map((item) => ServiceCategory.fromJson(item)).toList();
      }
    } catch (e) {
      // Fallback to offline catalog if network fails
    }

    return AppConstants.initialCategories
        .map((item) => ServiceCategory(
              id: item['id']!,
              name: item['name']!,
              slug: item['slug']!,
              description: item['description']!,
              iconName: item['icon'],
            ))
        .toList();
  }

  /// Fetch verified service professionals
  Future<List<ProfessionalProfile>> fetchProfessionals({
    String? categoryId,
    String? city,
  }) async {
    try {
      var query = _client
          .from('professional_profiles')
          .select('*')
          .eq('is_available', true);

      if (city != null && city.isNotEmpty) {
        query = query.eq('primary_city', city);
      }

      final res = await query.order('average_rating', ascending: false).limit(20);

      if (res.isNotEmpty) {
        return res.map((item) => ProfessionalProfile.fromJson(item)).toList();
      }
    } catch (e) {
      // Return fallback verified tradesmen
    }

    return [
      const ProfessionalProfile(
        id: 'pro-ph-001',
        userId: 'usr-pro-1',
        businessName: 'Apex Electrics & Power PH',
        headline: 'Certified Master Electrician & Solar Installer',
        bio: '12+ years experience servicing high-end residential and commercial facilities in Port Harcourt.',
        yearsOfExperience: 12,
        verificationStatus: 'approved',
        baseCalloutFeeKobo: 500000,
        averageRating: 4.9,
        reviewCount: 42,
        completedJobsCount: 88,
        primaryCity: 'Port Harcourt',
      ),
      const ProfessionalProfile(
        id: 'pro-ph-002',
        userId: 'usr-pro-2',
        businessName: 'Port Harcourt CoolBreeze ACs',
        headline: 'Inverter AC Maintenance & Gas Refill Specialist',
        bio: 'Rapid dispatch across GRA Phase 1 & 2, Peter Odili Road, and Trans-Amadi.',
        yearsOfExperience: 8,
        verificationStatus: 'approved',
        baseCalloutFeeKobo: 600000,
        averageRating: 4.8,
        reviewCount: 29,
        completedJobsCount: 56,
        primaryCity: 'Port Harcourt',
      ),
      const ProfessionalProfile(
        id: 'pro-ph-003',
        userId: 'usr-pro-3',
        businessName: 'Delta Flow Plumbing Systems',
        headline: 'Borehole Submersible & Tank Piping Expert',
        bio: 'Leak detection, pressure pump servicing, and bathroom overhaul specialists.',
        yearsOfExperience: 9,
        verificationStatus: 'approved',
        baseCalloutFeeKobo: 450000,
        averageRating: 5.0,
        reviewCount: 19,
        completedJobsCount: 34,
        primaryCity: 'Port Harcourt',
      ),
    ];
  }

  /// Fetch bookings for customer
  Future<List<Booking>> fetchCustomerBookings(String customerId) async {
    try {
      final res = await _client
          .from('bookings')
          .select('*, service_categories(name), professional_profiles(business_name)')
          .eq('customer_id', customerId)
          .order('created_at', ascending: false);

      return res.map((item) => Booking.fromJson(item)).toList();
    } catch (e) {
      // Fallback
    }
    return [];
  }

  /// Fetch available jobs or assigned jobs for professional
  Future<List<Booking>> fetchProfessionalJobs(String? proId) async {
    try {
      var query = _client.from('bookings').select(
          '*, service_categories(name), professional_profiles(business_name)');

      if (proId != null) {
        query = query.or('professional_id.eq.$proId,status.eq.draft');
      }

      final res = await query.order('created_at', ascending: false).limit(20);
      return res.map((item) => Booking.fromJson(item)).toList();
    } catch (e) {
      // Fallback
    }
    return [];
  }

  /// Submit a new service request
  Future<Booking> createBooking({
    required String customerId,
    required String categoryId,
    required String title,
    required String description,
    required String city,
    required String serviceAddress,
    String? preferredDate,
    String? preferredTimeSlot,
    String urgency = 'normal',
    String? professionalId,
  }) async {
    final ref =
        'BK-PH-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}-${Random().nextInt(900) + 100}';

    final payload = {
      'reference_code': ref,
      'customer_id': customerId,
      'category_id': categoryId,
      'professional_id': professionalId,
      'title': title.trim(),
      'description': description.trim(),
      'city': city.trim(),
      'service_address': serviceAddress.trim(),
      'preferred_date': preferredDate,
      'preferred_time_slot': preferredTimeSlot,
      'urgency': urgency,
      'status': professionalId != null ? 'confirmed' : 'draft',
      'created_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    try {
      final res = await _client.from('bookings').insert(payload).select().single();
      return Booking.fromJson(res);
    } catch (e) {
      // Local fallback representation
      return Booking(
        id: 'local-bk-${DateTime.now().millisecondsSinceEpoch}',
        referenceCode: ref,
        customerId: customerId,
        professionalId: professionalId,
        categoryId: categoryId,
        title: title,
        description: description,
        city: city,
        serviceAddress: serviceAddress,
        preferredDate: preferredDate,
        preferredTimeSlot: preferredTimeSlot,
        urgency: urgency,
        status: 'draft',
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  /// Fetch quotations for a booking
  Future<List<Quotation>> fetchQuotationsForBooking(String bookingId) async {
    try {
      final res = await _client
          .from('quotations')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', ascending: false);

      return res.map((item) => Quotation.fromJson(item)).toList();
    } catch (e) {
      // Fallback
    }
    return [];
  }

  /// Submit quotation (Professional)
  Future<Quotation> submitQuotation({
    required String bookingId,
    required String professionalId,
    required double labourAmountNaira,
    required double materialsAmountNaira,
    required double additionalExpensesNaira,
    int? estimatedDurationMinutes,
    String? workDescription,
  }) async {
    final labourKobo = (labourAmountNaira * 100).round();
    final materialsKobo = (materialsAmountNaira * 100).round();
    final expensesKobo = (additionalExpensesNaira * 100).round();
    final totalKobo = labourKobo + materialsKobo + expensesKobo;

    final ref =
        'QT-PH-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

    final payload = {
      'reference_code': ref,
      'booking_id': bookingId,
      'professional_id': professionalId,
      'status': 'pending',
      'total_amount_kobo': totalKobo,
      'labour_charges_kobo': labourKobo,
      'materials_costs_kobo': materialsKobo,
      'additional_expenses_kobo': expensesKobo,
      'estimated_duration_minutes': estimatedDurationMinutes,
      'workDescription': workDescription,
      'created_at': DateTime.now().toIso8601String(),
    };

    try {
      final res = await _client.from('quotations').insert(payload).select().single();
      return Quotation.fromJson(res);
    } catch (e) {
      return Quotation(
        id: 'local-qt-${DateTime.now().millisecondsSinceEpoch}',
        referenceCode: ref,
        bookingId: bookingId,
        professionalId: professionalId,
        status: 'pending',
        totalAmountKobo: totalKobo,
        labourChargesKobo: labourKobo,
        materialsCostsKobo: materialsKobo,
        additionalExpensesKobo: expensesKobo,
        estimatedDurationMinutes: estimatedDurationMinutes,
        workDescription: workDescription,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  /// Accept quotation (Customer)
  Future<void> acceptQuotation(String quotationId, String bookingId, int totalAmountKobo) async {
    try {
      await _client.from('quotations').update({
        'status': 'accepted',
        'accepted_at': DateTime.now().toIso8601String(),
      }).eq('id', quotationId);

      await _client.from('bookings').update({
        'status': 'confirmed',
        'accepted_quotation_id': quotationId,
        'agreed_amount_kobo': totalAmountKobo,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', bookingId);
    } catch (e) {
      // Ignored for offline preview
    }
  }

  /// Request job completion (Professional)
  Future<void> requestJobCompletion(String bookingId, String notes) async {
    try {
      await _client.from('bookings').update({
        'status': 'completion_requested',
        'pro_marked_complete_at': DateTime.now().toIso8601String(),
        'pro_completion_notes': notes,
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', bookingId);
    } catch (e) {
      // Ignored for offline preview
    }
  }

  /// Confirm job completion (Customer)
  Future<void> confirmJobCompletion(String bookingId) async {
    try {
      await _client.from('bookings').update({
        'status': 'completed',
        'customer_confirmed_at': DateTime.now().toIso8601String(),
        'completed_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', bookingId);
    } catch (e) {
      // Ignored for offline preview
    }
  }
}
