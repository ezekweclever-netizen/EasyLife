class PropertyItem {
  final String id;
  final String businessId;
  final String name;
  final String? code;
  final String? propertyType;
  final String city;
  final String state;
  final String address;
  final int unitsCount;
  final bool isActive;
  final String createdAt;

  const PropertyItem({
    required this.id,
    required this.businessId,
    required this.name,
    this.code,
    this.propertyType,
    required this.city,
    required this.state,
    required this.address,
    this.unitsCount = 1,
    this.isActive = true,
    required this.createdAt,
  });

  factory PropertyItem.fromJson(Map<String, dynamic> json) {
    return PropertyItem(
      id: json['id']?.toString() ?? '',
      businessId: json['business_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Commercial Property',
      code: json['code']?.toString(),
      propertyType: json['property_type']?.toString() ?? 'commercial',
      city: json['city']?.toString() ?? 'Port Harcourt',
      state: json['state']?.toString() ?? 'Rivers State',
      address: json['address']?.toString() ?? '',
      unitsCount: int.tryParse(json['units_count']?.toString() ?? '1') ?? 1,
      isActive: json['is_active'] != false,
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}
