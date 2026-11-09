class AssetItem {
  final String id;
  final String businessId;
  final String? propertyId;
  final String name;
  final String category;
  final String? brand;
  final String? modelNumber;
  final String? serialNumber;
  final int maintenanceIntervalDays;
  final String status;
  final String? nextServiceDueAt;
  final String createdAt;

  const AssetItem({
    required this.id,
    required this.businessId,
    this.propertyId,
    required this.name,
    required this.category,
    this.brand,
    this.modelNumber,
    this.serialNumber,
    this.maintenanceIntervalDays = 90,
    this.status = 'operational',
    this.nextServiceDueAt,
    required this.createdAt,
  });

  factory AssetItem.fromJson(Map<String, dynamic> json) {
    return AssetItem(
      id: json['id']?.toString() ?? '',
      businessId: json['business_id']?.toString() ?? '',
      propertyId: json['property_id']?.toString(),
      name: json['name']?.toString() ?? 'Equipment',
      category: json['asset_category']?.toString() ??
          json['category']?.toString() ??
          'Air Conditioning',
      brand: json['brand']?.toString(),
      modelNumber: json['model_number']?.toString(),
      serialNumber: json['serial_number']?.toString(),
      maintenanceIntervalDays: int.tryParse(
              json['maintenance_interval_days']?.toString() ?? '90') ??
          90,
      status: json['status']?.toString() ?? 'operational',
      nextServiceDueAt: json['next_service_due_at']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}
