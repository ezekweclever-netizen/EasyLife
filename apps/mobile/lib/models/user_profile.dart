import '../core/session_manager.dart';

class UserProfile {
  final String id;
  final String email;
  final String fullName;
  final String phone;
  final String city;
  final String state;
  final String? address;
  final String? avatarUrl;
  final AppRole primaryRole;
  final List<AppRole> assignedRoles;
  final bool isSuspended;

  UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phone,
    required this.city,
    required this.state,
    this.address,
    this.avatarUrl,
    required this.primaryRole,
    required this.assignedRoles,
    this.isSuspended = false,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final rolesRaw = json['user_roles'];
    final List<AppRole> parsedRoles = [];

    if (rolesRaw is List) {
      for (final r in rolesRaw) {
        if (r is Map && r['role'] != null) {
          parsedRoles.add(AppRoleExtension.fromKey(r['role'].toString()));
        }
      }
    }

    final primaryRoleStr = json['primary_role']?.toString() ?? 'customer';
    final primaryRole = AppRoleExtension.fromKey(primaryRoleStr);

    if (!parsedRoles.contains(primaryRole)) {
      parsedRoles.add(primaryRole);
    }

    return UserProfile(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? 'EasyLife User',
      phone: json['phone']?.toString() ?? '',
      city: json['city']?.toString() ?? 'Port Harcourt',
      state: json['state']?.toString() ?? 'Rivers State',
      address: json['address']?.toString(),
      avatarUrl: json['avatar_url']?.toString(),
      primaryRole: primaryRole,
      assignedRoles: parsedRoles.isNotEmpty ? parsedRoles : [primaryRole],
      isSuspended: json['is_suspended'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'phone': phone,
      'city': city,
      'state': state,
      'address': address,
      'avatar_url': avatarUrl,
      'primary_role': primaryRole.key,
      'is_suspended': isSuspended,
    };
  }
}
