class DisputeCase {
  final String id;
  final String referenceCode;
  final String bookingId;
  final String openedByUserId;
  final String againstUserId;
  final String category;
  final String description;
  final String status;
  final String? resolutionSummary;
  final String createdAt;

  const DisputeCase({
    required this.id,
    required this.referenceCode,
    required this.bookingId,
    required this.openedByUserId,
    required this.againstUserId,
    required this.category,
    required this.description,
    required this.status,
    this.resolutionSummary,
    required this.createdAt,
  });

  factory DisputeCase.fromJson(Map<String, dynamic> json) {
    return DisputeCase(
      id: json['id']?.toString() ?? '',
      referenceCode: json['reference_code']?.toString() ?? 'DSP-EASYLIFE',
      bookingId: json['booking_id']?.toString() ?? '',
      openedByUserId: json['opened_by_user_id']?.toString() ?? '',
      againstUserId: json['against_user_id']?.toString() ?? '',
      category: json['category']?.toString() ?? 'incomplete_work',
      description: json['description']?.toString() ?? '',
      status: json['status']?.toString() ?? 'open',
      resolutionSummary: json['resolution_summary']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}
