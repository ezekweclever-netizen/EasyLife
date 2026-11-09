class Booking {
  final String id;
  final String referenceCode;
  final String customerId;
  final String? professionalId;
  final String categoryId;
  final String? categoryName;
  final String? professionalName;
  final String title;
  final String description;
  final String urgency;
  final String status;
  final String city;
  final String serviceAddress;
  final String? preferredDate;
  final String? preferredTimeSlot;
  final int? agreedAmountKobo;
  final String? proCompletionNotes;
  final String? customerConfirmedAt;
  final String createdAt;

  const Booking({
    required this.id,
    required this.referenceCode,
    required this.customerId,
    this.professionalId,
    required this.categoryId,
    this.categoryName,
    this.professionalName,
    required this.title,
    required this.description,
    this.urgency = 'normal',
    required this.status,
    required this.city,
    required this.serviceAddress,
    this.preferredDate,
    this.preferredTimeSlot,
    this.agreedAmountKobo,
    this.proCompletionNotes,
    this.customerConfirmedAt,
    required this.createdAt,
  });

  double? get agreedAmountNaira =>
      agreedAmountKobo != null ? agreedAmountKobo! / 100.0 : null;

  bool get isCompleted => status.toLowerCase() == 'completed';
  bool get isDisputed => status.toLowerCase() == 'disputed';
  bool get isConfirmed => status.toLowerCase() == 'confirmed';
  bool get isInProgress => status.toLowerCase() == 'in_progress';
  bool get isCompletionRequested => status.toLowerCase() == 'completion_requested';

  factory Booking.fromJson(Map<String, dynamic> json) {
    String? catName;
    if (json['service_categories'] is Map) {
      catName = json['service_categories']['name']?.toString();
    }

    String? proName;
    if (json['professional_profiles'] is Map) {
      proName = json['professional_profiles']['business_name']?.toString();
    }

    return Booking(
      id: json['id']?.toString() ?? '',
      referenceCode: json['reference_code']?.toString() ?? 'BK-EASYLIFE',
      customerId: json['customer_id']?.toString() ?? '',
      professionalId: json['professional_id']?.toString(),
      categoryId: json['category_id']?.toString() ?? '',
      categoryName: catName,
      professionalName: proName,
      title: json['title']?.toString() ?? 'Service Request',
      description: json['description']?.toString() ?? '',
      urgency: json['urgency']?.toString() ?? 'normal',
      status: json['status']?.toString() ?? 'draft',
      city: json['city']?.toString() ?? 'Port Harcourt',
      serviceAddress: json['service_address']?.toString() ?? '',
      preferredDate: json['preferred_date']?.toString(),
      preferredTimeSlot: json['preferred_time_slot']?.toString(),
      agreedAmountKobo: json['agreed_amount_kobo'] is int
          ? json['agreed_amount_kobo']
          : int.tryParse(json['agreed_amount_kobo']?.toString() ?? ''),
      proCompletionNotes: json['pro_completion_notes']?.toString(),
      customerConfirmedAt: json['customer_confirmed_at']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}
