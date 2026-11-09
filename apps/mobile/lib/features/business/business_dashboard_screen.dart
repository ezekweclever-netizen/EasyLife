import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/property.dart';
import '../../models/asset_item.dart';
import '../../services/business_service.dart';
import '../../theme/easylife_theme.dart';
import '../../shared/logo.dart';
import 'properties_screen.dart';
import 'equipment_screen.dart';
import 'maintenance_screen.dart';

class BusinessDashboardScreen extends StatefulWidget {
  const BusinessDashboardScreen({super.key});

  @override
  State<BusinessDashboardScreen> createState() => _BusinessDashboardScreenState();
}

class _BusinessDashboardScreenState extends State<BusinessDashboardScreen> {
  final _businessService = BusinessService();
  List<PropertyItem> _properties = [];
  List<AssetItem> _assets = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBusinessData();
  }

  Future<void> _loadBusinessData() async {
    setState(() => _isLoading = true);
    final user = SessionManager().currentUser;
    final bizId = user?.id ?? 'biz-001';

    final props = await _businessService.fetchProperties(bizId);
    final assets = await _businessService.fetchAssets(bizId);

    if (mounted) {
      setState(() {
        _properties = props;
        _assets = assets;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = SessionManager().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const EasyLifeBrandLockup(
          size: 28,
          isDark: true,
          showSlogan: true,
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
              child: Text(
                'Business Portal',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadBusinessData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Business Header Banner
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [EasyLifeColors.navy900, EasyLifeColors.teal800],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.business,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      user?.fullName ?? 'Trans-Amadi Logistics Ltd',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const Text(
                                      'Corporate Property & Asset Management',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Divider(color: Colors.white24, height: 1),
                          const SizedBox(height: 14),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _buildStatItem('Properties', '${_properties.length}'),
                              _buildStatItem('Assets', '${_assets.length}'),
                              _buildStatItem('Open Orders', '2'),
                              _buildStatItem('Spend', '₦420k'),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Quick Management Modules
                    const Text(
                      'Management Modules',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: EasyLifeColors.navy900,
                      ),
                    ),
                    const SizedBox(height: 12),

                    _buildModuleTile(
                      icon: Icons.apartment,
                      title: 'Property Management',
                      subtitle:
                          'Manage ${_properties.length} commercial and residential locations in Port Harcourt',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                PropertiesScreen(properties: _properties),
                          ),
                        ).then((_) => _loadBusinessData());
                      },
                    ),
                    const SizedBox(height: 10),

                    _buildModuleTile(
                      icon: Icons.precision_manufacturing,
                      title: 'Equipment & Asset Registry',
                      subtitle:
                          'Track ${_assets.length} maintainable assets (Generators, Inverters, ACs)',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => EquipmentScreen(assets: _assets),
                          ),
                        ).then((_) => _loadBusinessData());
                      },
                    ),
                    const SizedBox(height: 10),

                    _buildModuleTile(
                      icon: Icons.build_circle_outlined,
                      title: 'Maintenance Records & Scheduling',
                      subtitle:
                          'Log faults, schedule preventive servicing, and track maintenance invoices',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MaintenanceScreen(),
                          ),
                        ).then((_) => _loadBusinessData());
                      },
                    ),
                    const SizedBox(height: 24),

                    // Critical Asset Service Reminders
                    const Text(
                      'Upcoming Preventive Servicing',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: EasyLifeColors.navy900,
                      ),
                    ),
                    const SizedBox(height: 10),

                    ..._assets.take(2).map((a) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: EasyLifeColors.surfaceWhite,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: EasyLifeColors.borderGrey),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.schedule,
                              color: EasyLifeColors.teal600,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    a.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                  Text(
                                    '${a.category} • Interval: ${a.maintenanceIntervalDays} days',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: EasyLifeColors.charcoal500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: EasyLifeColors.teal50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                a.nextServiceDueAt ?? 'Scheduled',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: EasyLifeColors.teal800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white60,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildModuleTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: EasyLifeColors.surfaceWhite,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: EasyLifeColors.borderGrey),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: const BoxDecoration(
            color: EasyLifeColors.teal50,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: EasyLifeColors.teal600, size: 22),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            color: EasyLifeColors.navy900,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 2.0),
          child: Text(
            subtitle,
            style: const TextStyle(fontSize: 12, color: EasyLifeColors.charcoal600),
          ),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 14,
          color: EasyLifeColors.charcoal500,
        ),
        onTap: onTap,
      ),
    );
  }
}
