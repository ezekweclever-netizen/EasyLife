import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static SupabaseClient? _mockClient;

  static set mockClient(SupabaseClient? client) {
    _mockClient = client;
  }

  static SupabaseClient get client {
    if (_mockClient != null) return _mockClient!;
    try {
      return Supabase.instance.client;
    } catch (_) {
      // Graceful fallback for test runners or pre-init environments
      _mockClient ??= SupabaseClient(
        'https://mock.supabase.co',
        'mock-anon-key',
        authOptions: const AuthClientOptions(autoRefreshToken: false),
      );
      return _mockClient!;
    }
  }

  static bool get isAuthenticated => client.auth.currentUser != null;

  static String? get currentUserId => client.auth.currentUser?.id;

  static String? get currentUserEmail => client.auth.currentUser?.email;
}
