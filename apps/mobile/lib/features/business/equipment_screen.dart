import 'package:flutter/material.dart';
import '../../core/session_manager.dart';
import '../../models/asset_item.dart';
import '../../services/business_service.dart';
import '../../shared/buttons.dart';
import '../../shared/empty_view.dart';
import '../../shared/status_chip.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';

class EquipmentScreen extends StatefulWidget {
  final List<AssetItem> assets;

  const EquipmentScreen({super.key, required this.assets});

  @override
  State<EquipmentScreen> createState() => _EquipmentScreenState();
}

class _EquipmentScreenState extends State<EquipmentScreen> {
  final _businessService = BusinessService();
  late List<AssetItem> _assets;

  final List<String> _assetCategories = [
    'Air Conditioning & Cooling',
    'Generators & Power Systems',
    'Solar & Inverter Systems',
    'Plumbing & Submersible Pumps',
    'Commercial Refrigeration',
    'Electrical Distribution Panels',
    'Other Maintainable Assets',
  ];

  @override
  void initState() {
    super.initState();
    _assets = List.from(widget.assets);
  }

  void _showAddAssetDialog() {
    final nameCtrl = TextEditingController();
    final brandCtrl = TextEditingController();
    final modelCtrl = TextEditingController();
    final serialCtrl = TextEditingController();
    final intervalCtrl = TextEditingController(text: '90');
    String selectedCategory = _assetCategories.first;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Register Equipment / Asset',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.navy900,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Asset Category',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                DropdownButtonFormField<String>(
                  initialValue: selectedCategory,
                  items: _assetCategories.map((c) {
                    return DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)));
                  }).toList(),
                  onChanged: (v) => selectedCategory = v ?? selectedCategory,
                ),
                const SizedBox(height: 12),
                EasyTextField(
                  label: 'Asset Name / Tag',
                  hint: 'e.g. 50kVA Standby Generator',
                  controller: nameCtrl,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: EasyTextField(
                        label: 'Brand / Manufacturer',
                        hint: 'e.g. Perkins / Daikin',
                        controller: brandCtrl,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: EasyTextField(
                        label: 'Model Number',
                        hint: 'e.g. PK-500',
                        controller: modelCtrl,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: EasyTextField(
                        label: 'Serial Number',
                        hint: 'e.g. SN-88391',
                        controller: serialCtrl,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: EasyTextField(
                        label: 'Interval (Days)',
                        controller: intervalCtrl,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                EasyButton(
                  label: 'Save Asset to Registry',
                  onPressed: () async {
                    if (nameCtrl.text.trim().isEmpty) return;
                    Navigator.pop(ctx);
                    final user = SessionManager().currentUser;
                    final newAsset = await _businessService.createAsset(
                      businessId: user?.id ?? 'biz-001',
                      name: nameCtrl.text,
                      category: selectedCategory,
                      brand: brandCtrl.text,
                      modelNumber: modelCtrl.text,
                      serialNumber: serialCtrl.text,
                      maintenanceIntervalDays: int.tryParse(intervalCtrl.text) ?? 90,
                    );
                    setState(() => _assets.insert(0, newAsset));
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Equipment Registry'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Add Equipment',
            onPressed: _showAddAssetDialog,
          ),
        ],
      ),
      body: _assets.isEmpty
          ? EmptyView(
              icon: Icons.precision_manufacturing,
              title: 'No Assets Registered',
              message: 'Register maintainable equipment (ACs, Generators, Inverters).',
              buttonLabel: 'Register Equipment',
              onButtonPressed: _showAddAssetDialog,
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _assets.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final asset = _assets[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: EasyLifeColors.surfaceWhite,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: EasyLifeColors.borderGrey),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              asset.name,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: EasyLifeColors.navy900,
                              ),
                            ),
                          ),
                          StatusChip(status: asset.status),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        asset.category,
                        style: const TextStyle(
                          fontSize: 12,
                          color: EasyLifeColors.teal700,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (asset.brand != null) ...[
                            Text(
                              'Brand: ${asset.brand}',
                              style: const TextStyle(fontSize: 11, color: EasyLifeColors.charcoal600),
                            ),
                            const SizedBox(width: 12),
                          ],
                          if (asset.modelNumber != null) ...[
                            Text(
                              'Model: ${asset.modelNumber}',
                              style: const TextStyle(fontSize: 11, color: EasyLifeColors.charcoal600),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 10),
                      const Divider(color: EasyLifeColors.borderGrey, height: 1),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Cycle: Every ${asset.maintenanceIntervalDays} days',
                            style: const TextStyle(
                              fontSize: 11,
                              color: EasyLifeColors.charcoal500,
                            ),
                          ),
                          Text(
                            'Due: ${asset.nextServiceDueAt ?? "Within 60d"}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: EasyLifeColors.teal800,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: EasyLifeColors.teal600,
        foregroundColor: Colors.white,
        onPressed: _showAddAssetDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
