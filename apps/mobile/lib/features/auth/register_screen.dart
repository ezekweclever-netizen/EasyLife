import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../services/auth_service.dart';
import '../../shared/buttons.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';
import '../../shared/logo.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();

  AppRole _selectedRole = AppRole.customer;
  String _selectedCity = AppConstants.defaultCity;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = await _authService.signUp(
        email: _emailController.text,
        password: _passwordController.text,
        fullName: _nameController.text,
        phone: _phoneController.text,
        role: _selectedRole,
        city: _selectedCity,
        state: AppConstants.defaultState,
      );

      if (mounted) {
        if (user != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Registration successful! Welcome to EasyLife.'),
              backgroundColor: EasyLifeColors.teal600,
            ),
          );
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const EasyLifeBrandLockup(
                  size: 36,
                  isDark: false,
                  showSlogan: true,
                ),
                const SizedBox(height: 20),
                const Text(
                  'Join EasyLife Nigeria',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.navy900,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Choose your account type to get started with verified marketplace services.',
                  style: TextStyle(
                    fontSize: 14,
                    color: EasyLifeColors.charcoal600,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Account Type',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: EasyLifeColors.charcoal800,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildRoleCard(AppRole.customer, 'Customer', Icons.person_outline),
                    const SizedBox(width: 8),
                    _buildRoleCard(AppRole.professional, 'Artisan / Pro', Icons.handyman_outlined),
                    const SizedBox(width: 8),
                    _buildRoleCard(AppRole.business, 'Business', Icons.business_outlined),
                  ],
                ),
                const SizedBox(height: 20),
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: EasyLifeColors.errorBg,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(
                        color: EasyLifeColors.errorText,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                EasyTextField(
                  label: _selectedRole == AppRole.business
                      ? 'Company / Facility Name'
                      : 'Full Name',
                  hint: _selectedRole == AppRole.business
                      ? 'e.g. Trans-Amadi Logistics Ltd'
                      : 'e.g. Chidi Okafor',
                  controller: _nameController,
                  prefixIcon: Icons.badge_outlined,
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Please enter your name' : null,
                ),
                const SizedBox(height: 16),
                EasyTextField(
                  label: 'Email Address',
                  hint: 'e.g. user@example.com',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: (v) =>
                      v == null || !v.contains('@') ? 'Valid email required' : null,
                ),
                const SizedBox(height: 16),
                EasyTextField(
                  label: 'Phone Number',
                  hint: 'e.g. +234 803 123 4567',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_outlined,
                  validator: (v) =>
                      v == null || v.trim().length < 8 ? 'Valid phone required' : null,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Operating City',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: EasyLifeColors.charcoal800,
                  ),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: _selectedCity,
                  decoration: const InputDecoration(),
                  items: AppConstants.supportedCities.map((city) {
                    return DropdownMenuItem(
                      value: city,
                      child: Text(city),
                    );
                  }).toList(),
                  onChanged: (v) {
                    if (v != null) {
                      setState(() => _selectedCity = v);
                    }
                  },
                ),
                const SizedBox(height: 16),
                EasyTextField(
                  label: 'Password',
                  hint: 'At least 8 characters',
                  controller: _passwordController,
                  isPassword: true,
                  prefixIcon: Icons.lock_outline,
                  validator: (v) =>
                      v == null || v.length < 8 ? 'Minimum 8 characters' : null,
                ),
                const SizedBox(height: 24),
                EasyButton(
                  label: 'Complete Registration',
                  isLoading: _isLoading,
                  onPressed: _handleRegister,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Already have an account? ',
                      style: TextStyle(color: EasyLifeColors.charcoal600),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const LoginScreen(),
                          ),
                        );
                      },
                      child: const Text(
                        'Sign In',
                        style: TextStyle(
                          color: EasyLifeColors.teal600,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(AppRole role, String label, IconData icon) {
    final isSelected = _selectedRole == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedRole = role),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? EasyLifeColors.teal50 : EasyLifeColors.surfaceWhite,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? EasyLifeColors.teal600 : EasyLifeColors.borderGrey,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? EasyLifeColors.teal600 : EasyLifeColors.charcoal600,
                size: 22,
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? EasyLifeColors.teal800 : EasyLifeColors.charcoal700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
