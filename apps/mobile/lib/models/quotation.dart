class Quotation {
  final String id;
  final String referenceCode;
  final String bookingId;
  final String professionalId;
  final String status;
  final int totalAmountKobo;
  final int labourChargesKobo;
  final int materialsCostsKobo;
  final int additionalExpensesKobo;
  final int? estimatedDurationMinutes;
  final String? workDescription;
  final String? notes;
  final String createdAt;

  const Quotation({
    required this.id,
    required this.referenceCode,
    required this.bookingId,
    required this.professionalId,
    required this.status,
    required this.totalAmountKobo,
    this.labourChargesKobo = 0,
    this.materialsCostsKobo = 0,
    this.additionalExpensesKobo = 0,
    this.estimatedDurationMinutes,
    this.workDescription,
    this.notes,
    required this.createdAt,
  });

  double get totalAmountNaira => totalAmountKobo / 100.0;
  double get labourNaira => labourChargesKobo / 100.0;
  double get materialsNaira => materialsCostsKobo / 100.0;
  double get expensesNaira => additionalExpensesKobo / 100.0;

  bool get isPending => status.toLowerCase() == 'pending';
  bool get isAccepted => status.toLowerCase() == 'accepted';
  bool get isDeclined => status.toLowerCase() == 'declined';

  factory Quotation.fromJson(Map<String, dynamic> json) {
    return Quotation(
      id: json['id']?.toString() ?? '',
      referenceCode: json['reference_code']?.toString() ?? 'QT-EASYLIFE',
      bookingId: json['booking_id']?.toString() ?? '',
      professionalId: json['professional_id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      totalAmountKobo: int.tryParse(json['total_amount_kobo']?.toString() ?? '0') ?? 0,
      labourChargesKobo: int.tryParse(json['labour_charges_kobo']?.toString() ?? '0') ?? 0,
      materialsCostsKobo: int.tryParse(json['materials_costs_kobo']?.toString() ?? '0') ?? 0,
      additionalExpensesKobo: int.tryParse(json['additional_expenses_kobo']?.toString() ?? '0') ?? 0,
      estimatedDurationMinutes: int.tryParse(json['estimated_duration_minutes']?.toString() ?? ''),
      workDescription: json['work_description']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}
