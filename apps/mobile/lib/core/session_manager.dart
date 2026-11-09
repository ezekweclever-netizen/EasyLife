import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_profile.dart';

enum AppRole {
  customer,
  professional,
  business,
  admin,
}

extension AppRoleExtension on AppRole {
  String get displayName {
    switch (this) {
      case AppRole.customer:
        return 'Customer';
      case AppRole.professional:
        return 'Service Professional';
      case AppRole.business:
        return 'Business / Property Manager';
      case AppRole.admin:
        return 'Administrator';
    }
  }

  String get key {
    switch (this) {
      case AppRole.customer:
        return 'customer';
      case AppRole.professional:
        return 'professional';
      case AppRole.business:
        return 'business_client';
      case AppRole.admin:
        return 'admin';
    }
  }

  static AppRole fromKey(String key) {
    switch (key.toLowerCase()) {
      case 'professional':
        return AppRole.professional;
      case 'business_client':
      case 'business':
        return AppRole.business;
      case 'admin':
        return AppRole.admin;
      case 'customer':
      default:
        return AppRole.customer;
    }
  }
}

/// Central Session & Role Manager for EasyLife Mobile
class SessionManager extends ChangeNotifier {
  static final SessionManager _instance = SessionManager._internal();
  factory SessionManager() => _instance;
  SessionManager._internal();

  UserProfile? _currentUser;
  AppRole _activeRole = AppRole.customer;
  List<AppRole> _availableRoles = [AppRole.customer];
  bool _isInitialized = false;

  UserProfile? get currentUser => _currentUser;
  AppRole get activeRole => _activeRole;
  List<AppRole> get availableRoles => List.unmodifiable(_availableRoles);
  bool get isAuthenticated => _currentUser != null;
  bool get isInitialized => _isInitialized;

  /// Initialize session from Supabase client
  Future<void> initialize() async {
    final client = Supabase.instance.client;
    final session = client.auth.currentSession;

    if (session != null) {
      await _loadUserProfile(session.user.id, session.user.email);
    } else {
      // Default guest / demo customer state for seamless initial preview
      _currentUser = null;
      _activeRole = AppRole.customer;
      _availableRoles = [AppRole.customer, AppRole.professional, AppRole.business];
    }

    _isInitialized = true;
    notifyListeners();

    // Listen to live auth changes
    client.auth.onAuthStateChange.listen((data) async {
      final AuthChangeEvent event = data.event;
      final Session? currentSession = data.session;

      if (event == AuthChangeEvent.signedIn && currentSession != null) {
        await _loadUserProfile(currentSession.user.id, currentSession.user.email);
      } else if (event == AuthChangeEvent.signedOut) {
        _currentUser = null;
        _activeRole = AppRole.customer;
        _availableRoles = [AppRole.customer];
        notifyListeners();
      }
    });
  }

  Future<void> _loadUserProfile(String userId, String? email) async {
    try {
      final client = Supabase.instance.client;
      final res = await client
          .from('profiles')
          .select('*, user_roles(role, is_active)')
          .eq('id', userId)
          .maybeSingle();

      if (res != null) {
        _currentUser = UserProfile.fromJson(res);
        _availableRoles = _currentUser!.assignedRoles.isNotEmpty
            ? _currentUser!.assignedRoles
            : [AppRole.customer];
        _activeRole = _currentUser!.primaryRole;
      } else {
        // Fallback user if profile row is pending creation
        _currentUser = UserProfile(
          id: userId,
          email: email ?? '',
          fullName: 'EasyLife User',
          phone: '',
          city: 'Port Harcourt',
          state: 'Rivers State',
          primaryRole: AppRole.customer,
          assignedRoles: [AppRole.customer, AppRole.professional, AppRole.business],
        );
        _availableRoles = _currentUser!.assignedRoles;
        _activeRole = AppRole.customer;
      }
    } catch (e) {
      debugPrint('[SessionManager] Error loading profile: $e');
      _currentUser = UserProfile(
        id: userId,
        email: email ?? '',
        fullName: 'EasyLife User',
        phone: '',
        city: 'Port Harcourt',
        state: 'Rivers State',
        primaryRole: AppRole.customer,
        assignedRoles: [AppRole.customer, AppRole.professional, AppRole.business],
      );
      _availableRoles = _currentUser!.assignedRoles;
      _activeRole = AppRole.customer;
    }
    notifyListeners();
  }

  /// Manually switch active role
  void switchActiveRole(AppRole role) {
    if (_activeRole != role) {
      _activeRole = role;
      notifyListeners();
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await Supabase.instance.client.auth.signOut();
    } catch (e) {
      debugPrint('[SessionManager] Error during sign out: $e');
    }
    _currentUser = null;
    _activeRole = AppRole.customer;
    _availableRoles = [AppRole.customer];
    notifyListeners();
  }

  /// Set mock / test user for demo & UI testing
  void setMockUser({
    required String id,
    required String email,
    required String fullName,
    required AppRole role,
  }) {
    _currentUser = UserProfile(
      id: id,
      email: email,
      fullName: fullName,
      phone: '+234 803 123 4567',
      city: 'Port Harcourt',
      state: 'Rivers State',
      primaryRole: role,
      assignedRoles: [AppRole.customer, AppRole.professional, AppRole.business],
    );
    _availableRoles = [AppRole.customer, AppRole.professional, AppRole.business];
    _activeRole = role;
    notifyListeners();
  }
}
