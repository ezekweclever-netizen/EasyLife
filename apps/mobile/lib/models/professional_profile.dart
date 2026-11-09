class ProfessionalProfile {
  final String id;
  final String userId;
  final String businessName;
  final String? headline;
  final String? bio;
  final int yearsOfExperience;
  final String verificationStatus;
  final int baseCalloutFeeKobo;
  final double averageRating;
  final int reviewCount;
  final int completedJobsCount;
  final bool isAvailable;
  final String primaryCity;
  final String primaryState;

  const ProfessionalProfile({
    required this.id,
    required this.userId,
    required this.businessName,
    this.headline,
    this.bio,
    this.yearsOfExperience = 0,
    required this.verificationStatus,
    this.baseCalloutFeeKobo = 500000, // ₦5,000 default
    this.averageRating = 5.0,
    this.reviewCount = 0,
    this.completedJobsCount = 0,
    this.isAvailable = true,
    this.primaryCity = 'Port Harcourt',
    this.primaryState = 'Rivers State',
  });

  bool get isVerified => verificationStatus.toLowerCase() == 'approved';
  double get calloutFeeNaira => baseCalloutFeeKobo / 100.0;

  factory ProfessionalProfile.fromJson(Map<String, dynamic> json) {
    return ProfessionalProfile(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      businessName: json['business_name']?.toString() ?? 'EasyLife Professional',
      headline: json['headline']?.toString(),
      bio: json['bio']?.toString(),
      yearsOfExperience: int.tryParse(json['years_of_experience']?.toString() ?? '0') ?? 0,
      verificationStatus: json['verification_status']?.toString() ?? 'pending',
      baseCalloutFeeKobo: int.tryParse(json['base_callout_fee_kobo']?.toString() ?? '500000') ?? 500000,
      averageRating: double.tryParse(json['average_rating']?.toString() ?? '5.0') ?? 5.0,
      reviewCount: int.tryParse(json['review_count']?.toString() ?? '0') ?? 0,
      completedJobsCount: int.tryParse(json['completed_jobs_count']?.toString() ?? '0') ?? 0,
      isAvailable: json['is_available'] != false,
      primaryCity: json['primary_city']?.toString() ?? 'Port Harcourt',
      primaryState: json['primary_state']?.toString() ?? 'Rivers State',
    );
  }
}
