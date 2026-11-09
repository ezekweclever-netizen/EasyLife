class ReviewItem {
  final String id;
  final String bookingId;
  final String reviewerUserId;
  final String professionalId;
  final int rating;
  final String? title;
  final String comment;
  final String createdAt;
  final bool isPublished;

  const ReviewItem({
    required this.id,
    required this.bookingId,
    required this.reviewerUserId,
    required this.professionalId,
    required this.rating,
    this.title,
    required this.comment,
    required this.createdAt,
    this.isPublished = true,
  });

  factory ReviewItem.fromJson(Map<String, dynamic> json) {
    return ReviewItem(
      id: json['id']?.toString() ?? '',
      bookingId: json['booking_id']?.toString() ?? '',
      reviewerUserId: json['reviewer_user_id']?.toString() ?? '',
      professionalId: json['professional_id']?.toString() ?? '',
      rating: int.tryParse(json['rating']?.toString() ?? '5') ?? 5,
      title: json['title']?.toString(),
      comment: json['comment']?.toString() ?? '',
      createdAt: json['created_at']?.toString() ?? '',
      isPublished: json['is_published'] != false,
    );
  }
}
