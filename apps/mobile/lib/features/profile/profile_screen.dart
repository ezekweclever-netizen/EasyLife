import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../shared/buttons.dart';
import '../../theme/easylife_theme.dart';
import '../../shared/logo.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  void _showRoleSwitcherDialog() {
    final session = SessionManager();
    final currentRole = session.activeRole;

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Switch Active Role'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildRoleOption(
                ctx,
                AppRole.customer,
                'Customer Mode',
                'Find services, book artisans, and review work',
                Icons.person_outline,
                currentRole == AppRole.customer,
              ),
              const SizedBox(height: 10),
              _buildRoleOption(
                ctx,
                AppRole.professional,
                'Artisan / Pro Mode',
                'View job leads, submit quotations, and receive payouts',
                Icons.handyman_outlined,
                currentRole == AppRole.professional,
              ),
              const SizedBox(height: 10),
              _buildRoleOption(
                ctx,
                AppRole.business,
                'Business / Facility Portal',
                'Manage properties, equipment assets, and preventive maintenance',
                Icons.business_outlined,
                currentRole == AppRole.business,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildRoleOption(
    BuildContext ctx,
    AppRole role,
    String title,
    String desc,
    IconData icon,
    bool isSelected,
  ) {
    return GestureDetector(
      onTap: () {
        SessionManager().switchActiveRole(role);
        Navigator.pop(ctx);
        setState(() {});
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? EasyLifeColors.teal50 : EasyLifeColors.surfaceWhite,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? EasyLifeColors.teal600 : EasyLifeColors.borderGrey,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? EasyLifeColors.teal600 : EasyLifeColors.charcoal600),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: isSelected ? EasyLifeColors.teal800 : EasyLifeColors.navy900,
                    ),
                  ),
                  Text(
                    desc,
                    style: const TextStyle(fontSize: 11, color: EasyLifeColors.charcoal500),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPrivacyDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.shield_outlined, color: EasyLifeColors.primary, size: 24),
              SizedBox(width: 8),
              Text('Privacy & NDPA 2023', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Under the Nigeria Data Protection Act (NDPA) 2023, you have statutory rights regarding your personal data:',
                  style: TextStyle(fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 10),
                const Text('• Right to access and data portability', style: TextStyle(fontSize: 12)),
                const Text('• Right to rectification and accurate records', style: TextStyle(fontSize: 12)),
                const Text('• Right to statutory account deletion / erasure', style: TextStyle(fontSize: 12)),
                const Text('• Direct access to DPO: privacy@easylife.ng', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: EasyLifeColors.background,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: EasyLifeColors.border),
                  ),
                  child: const Text(
                    'Notice: Requests for deletion are subject to statutory verification to protect active escrow transactions and warranty dispute periods.',
                    style: TextStyle(fontSize: 11, color: EasyLifeColors.muted),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
            TextButton(
              style: TextButton.styleFrom(foregroundColor: Colors.red.shade700),
              onPressed: () {
                Navigator.pop(ctx);
                _showDeletionRequestDialog();
              },
              child: const Text('Request Deletion'),
            ),
          ],
        );
      },
    );
  }

  void _showDeletionRequestDialog() {
    final reasonController = TextEditingController();
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Request Account Deletion', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'In accordance with NDPA 2023 Section 34, please specify why you are requesting account deletion:',
                    style: TextStyle(fontSize: 12, color: EasyLifeColors.muted),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: reasonController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Enter reason for deletion (e.g., relocating, no longer needed)...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade700,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          final text = reasonController.text.trim();
                          if (text.length < 5) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please provide a reason of at least 5 characters.')),
                            );
                            return;
                          }
                          setDialogState(() => isSubmitting = true);
                          await Future.delayed(const Duration(milliseconds: 600));
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              const SnackBar(
                                content: Text('Account deletion request submitted under NDPA 2023. Our DPO will review within statutory timeframes.'),
                                backgroundColor: EasyLifeColors.primary,
                              ),
                            );
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Submit Request'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = SessionManager();
    final user = session.currentUser;
    final activeRole = session.activeRole;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile & Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: EasyLifeColors.surfaceWhite,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: EasyLifeColors.borderGrey),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: EasyLifeColors.teal50,
                    child: Text(
                      (user?.fullName.isNotEmpty == true ? user!.fullName.substring(0, 1) : 'E'),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: EasyLifeColors.teal800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.fullName ?? 'EasyLife Guest User',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: EasyLifeColors.navy900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? 'demo.user@easylife.ng',
                          style: const TextStyle(
                            fontSize: 12,
                            color: EasyLifeColors.charcoal600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: EasyLifeColors.teal50,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            activeRole.displayName.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: EasyLifeColors.teal800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Role Switcher Tile
            Material(
              color: EasyLifeColors.surfaceWhite,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: EasyLifeColors.teal500, width: 1.5),
              ),
              child: ListTile(
                leading: const Icon(Icons.swap_horiz, color: EasyLifeColors.teal600),
                title: const Text(
                  'Switch Active Role',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                subtitle: Text('Currently viewing as: ${activeRole.displayName}'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                onTap: _showRoleSwitcherDialog,
              ),
            ),
            const SizedBox(height: 20),

            // Profile Details List
            Container(
              decoration: BoxDecoration(
                color: EasyLifeColors.surfaceWhite,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: EasyLifeColors.borderGrey),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.phone_outlined, size: 20),
                    title: const Text('Phone Number', style: TextStyle(fontSize: 13)),
                    subtitle: Text(user?.phone.isNotEmpty == true ? user!.phone : '+234 803 000 0000'),
                  ),
                  const Divider(height: 1, color: EasyLifeColors.borderGrey),
                  ListTile(
                    leading: const Icon(Icons.location_city_outlined, size: 20),
                    title: const Text('Primary City', style: TextStyle(fontSize: 13)),
                    subtitle: Text('${user?.city ?? "Port Harcourt"}, ${user?.state ?? "Rivers State"}'),
                  ),
                  const Divider(height: 1, color: EasyLifeColors.borderGrey),
                  const ListTile(
                    leading: Icon(Icons.verified_user_outlined, size: 20),
                    title: Text('Account Security & PIN', style: TextStyle(fontSize: 13)),
                    subtitle: Text('4-Digit Job Completion PIN is active'),
                  ),
                  const Divider(height: 1, color: EasyLifeColors.borderGrey),
                  ListTile(
                    leading: const Icon(Icons.privacy_tip_outlined, size: 20),
                    title: const Text('Privacy & Data Rights', style: TextStyle(fontSize: 13)),
                    subtitle: const Text('NDPA 2023 Statutory Rights & Account Deletion'),
                    trailing: const Icon(Icons.chevron_right, size: 18),
                    onTap: _showPrivacyDialog,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Auth Button
            if (user != null)
              EasyButton(
                label: 'Sign Out',
                isOutlined: true,
                backgroundColor: Colors.red.shade700,
                onPressed: () async {
                  await session.signOut();
                  setState(() {});
                },
              )
            else
              EasyButton(
                label: 'Sign In / Register',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  ).then((_) => setState(() {}));
                },
              ),
            const SizedBox(height: 24),
            const Center(
              child: EasyLifeBrandLockup(
                size: 24,
                isDark: false,
                showSlogan: true,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'EasyLife Nigeria Mobile v0.1.0\nPort Harcourt Pilot Release',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: EasyLifeColors.charcoal500),
            ),
          ],
        ),
      ),
    );
  }
}
