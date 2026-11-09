import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../models/property.dart';
import '../../services/business_service.dart';
import '../../shared/buttons.dart';
import '../../shared/empty_view.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';

class PropertiesScreen extends StatefulWidget {
  final List<PropertyItem> properties;

  const PropertiesScreen({super.key, required this.properties});

  @override
  State<PropertiesScreen> createState() => _PropertiesScreenState();
}

class _PropertiesScreenState extends State<PropertiesScreen> {
  final _businessService = BusinessService();
  late List<PropertyItem> _properties;

  @override
  void initState() {
    super.initState();
    _properties = List.from(widget.properties);
  }

  void _showAddPropertyDialog() {
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final unitsCtrl = TextEditingController(text: '1');
    String selectedArea = AppConstants.portHarcourtAreas.first;

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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Register Business Property',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: EasyLifeColors.navy900,
                ),
              ),
              const SizedBox(height: 16),
              EasyTextField(
                label: 'Property Name',
                hint: 'e.g. Trans-Amadi Depot',
                controller: nameCtrl,
              ),
              const SizedBox(height: 12),
              EasyTextField(
                label: 'Street Address',
                hint: 'e.g. Plot 15 Industrial Estate',
                controller: addressCtrl,
              ),
              const SizedBox(height: 12),
              const Text(
                'Area / District',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              DropdownButtonFormField<String>(
                initialValue: selectedArea,
                items: AppConstants.portHarcourtAreas.map((a) {
                  return DropdownMenuItem(value: a, child: Text(a));
                }).toList(),
                onChanged: (v) => selectedArea = v ?? selectedArea,
              ),
              const SizedBox(height: 12),
              EasyTextField(
                label: 'Number of Units / Offices',
                controller: unitsCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 20),
              EasyButton(
                label: 'Save Property',
                onPressed: () async {
                  if (nameCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  final user = SessionManager().currentUser;
                  final newProp = await _businessService.createProperty(
                    businessId: user?.id ?? 'biz-001',
                    name: nameCtrl.text,
                    address: '${addressCtrl.text}, $selectedArea',
                    city: 'Port Harcourt',
                    state: 'Rivers State',
                    unitsCount: int.tryParse(unitsCtrl.text) ?? 1,
                  );
                  setState(() => _properties.insert(0, newProp));
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Managed Properties'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Add Property',
            onPressed: _showAddPropertyDialog,
          ),
        ],
      ),
      body: _properties.isEmpty
          ? EmptyView(
              icon: Icons.apartment,
              title: 'No Properties Registered',
              message: 'Add business locations or residential facilities.',
              buttonLabel: 'Add Property',
              onButtonPressed: _showAddPropertyDialog,
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _properties.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final prop = _properties[index];
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
                          Text(
                            prop.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: EasyLifeColors.navy900,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: EasyLifeColors.teal50,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${prop.unitsCount} Units',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: EasyLifeColors.teal800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined,
                              size: 14, color: EasyLifeColors.charcoal500),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              prop.address,
                              style: const TextStyle(
                                fontSize: 12,
                                color: EasyLifeColors.charcoal600,
                              ),
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
        onPressed: _showAddPropertyDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
