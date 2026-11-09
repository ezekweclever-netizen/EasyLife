class ServiceCategory {
  final String id;
  final String name;
  final String slug;
  final String description;
  final String? iconName;
  final int defaultCommissionBps;
  final bool isActive;
  final int displayOrder;

  const ServiceCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    this.iconName,
    this.defaultCommissionBps = 1000,
    this.isActive = true,
    this.displayOrder = 0,
  });

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    return ServiceCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      iconName: json['icon_name']?.toString(),
      defaultCommissionBps: json['default_commission_bps'] is int
          ? json['default_commission_bps']
          : int.tryParse(json['default_commission_bps']?.toString() ?? '1000') ?? 1000,
      isActive: json['is_active'] != false,
      displayOrder: json['display_order'] is int
          ? json['display_order']
          : int.tryParse(json['display_order']?.toString() ?? '0') ?? 0,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ServiceCategory && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
