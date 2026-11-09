import 'package:flutter/material.dart';
import '../../models/service_category.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';
import 'service_request_screen.dart';

class ServiceCatalogScreen extends StatefulWidget {
  final List<ServiceCategory> categories;

  const ServiceCatalogScreen({super.key, required this.categories});

  @override
  State<ServiceCatalogScreen> createState() => _ServiceCatalogScreenState();
}

class _ServiceCatalogScreenState extends State<ServiceCatalogScreen> {
  final _searchController = TextEditingController();
  String _filter = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  IconData _getCategoryIcon(String? iconName) {
    switch (iconName) {
      case 'plumbing':
        return Icons.plumbing;
      case 'bolt':
        return Icons.bolt;
      case 'ac_unit':
        return Icons.ac_unit;
      case 'precision_manufacturing':
        return Icons.precision_manufacturing;
      case 'solar_power':
        return Icons.solar_power;
      case 'carpenter':
        return Icons.carpenter;
      case 'format_paint':
        return Icons.format_paint;
      case 'pest_control':
        return Icons.pest_control;
      default:
        return Icons.handyman;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = widget.categories.where((c) {
      final q = _filter.toLowerCase();
      return c.name.toLowerCase().contains(q) ||
          c.description.toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Service Categories'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            EasyTextField(
              label: 'Search Services',
              hint: 'e.g. AC repair, plumbing leak, generator...',
              controller: _searchController,
              prefixIcon: Icons.search,
              onChanged: (v) => setState(() => _filter = v),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: filtered.isEmpty
                  ? const Center(
                      child: Text(
                        'No matching categories found.',
                        style: TextStyle(color: EasyLifeColors.charcoal500),
                      ),
                    )
                  : ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final cat = filtered[index];
                        return Container(
                          decoration: BoxDecoration(
                            color: EasyLifeColors.surfaceWhite,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: EasyLifeColors.borderGrey),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            leading: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: const BoxDecoration(
                                color: EasyLifeColors.teal50,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _getCategoryIcon(cat.iconName),
                                color: EasyLifeColors.teal600,
                                size: 24,
                              ),
                            ),
                            title: Text(
                              cat.name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: EasyLifeColors.navy900,
                              ),
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Text(
                                cat.description,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: EasyLifeColors.charcoal600,
                                  height: 1.3,
                                ),
                              ),
                            ),
                            trailing: const Icon(
                              Icons.arrow_forward_ios,
                              size: 14,
                              color: EasyLifeColors.charcoal500,
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ServiceRequestScreen(
                                    preselectedCategory: cat,
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
