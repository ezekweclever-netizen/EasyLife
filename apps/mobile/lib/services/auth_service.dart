import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/session_manager.dart';
import '../models/user_profile.dart';
import 'supabase_service.dart';

class AuthService {
  final SupabaseClient _client = SupabaseService.client;

  /// Sign in with email and password
  Future<UserProfile?> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );

      if (res.user != null) {
        await SessionManager().initialize();
        return SessionManager().currentUser;
      }
      return null;
    } on AuthException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Sign in failed: $e');
    }
  }

  /// Register a new account
  Future<UserProfile?> signUp({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required AppRole role,
    String city = 'Port Harcourt',
    String state = 'Rivers State',
  }) async {
    try {
      final res = await _client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {
          'full_name': fullName.trim(),
          'phone': phone.trim(),
          'primary_role': role.key,
          'city': city,
          'state': state,
        },
      );

      if (res.user != null) {
        // Upsert into public.profiles
        await _client.from('profiles').upsert({
          'id': res.user!.id,
          'email': email.trim(),
          'full_name': fullName.trim(),
          'phone': phone.trim(),
          'primary_role': role.key,
          'city': city,
          'state': state,
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        });

        // Insert role
        await _client.from('user_roles').upsert({
          'user_id': res.user!.id,
          'role': role.key,
          'is_active': true,
        });

        // If pro, scaffold professional_profile
        if (role == AppRole.professional) {
          await _client.from('professional_profiles').upsert({
            'user_id': res.user!.id,
            'business_name': fullName.trim(),
            'slug': 'pro-${res.user!.id.substring(0, 8)}',
            'verification_status': 'pending',
            'primary_city': city,
            'primary_state': state,
          });
        }

        await SessionManager().initialize();
        return SessionManager().currentUser;
      }
      return null;
    } on AuthException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  /// Request password recovery email
  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _client.auth.resetPasswordForEmail(
        email.trim(),
        redirectTo: 'easylife://reset-password',
      );
    } on AuthException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Password reset request failed: $e');
    }
  }

  /// Sign out
  Future<void> signOut() async {
    await SessionManager().signOut();
  }

  /// Update user profile
  Future<void> updateProfile({
    required String fullName,
    required String phone,
    required String city,
    required String state,
    String? address,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('No authenticated user');

    await _client.from('profiles').update({
      'full_name': fullName.trim(),
      'phone': phone.trim(),
      'city': city.trim(),
      'state': state.trim(),
      'address': address?.trim(),
      'updated_at': DateTime.now().toIso8601String(),
    }).eq('id', user.id);

    await SessionManager().initialize();
  }
}
