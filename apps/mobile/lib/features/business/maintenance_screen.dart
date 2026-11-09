import 'package:flutter/material.dart';
import '../../shared/buttons.dart';
import '../../shared/status_chip.dart';
import '../../shared/text_fields.dart';
import '../../theme/easylife_theme.dart';

class MaintenanceScreen extends StatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  final List<Map<String, dynamic>> _records = [
    {
      'id': 'mnt-001',
      'title': 'Perkins 150kVA Routine 250hr Service',
      'asset': 'Perkins 150kVA Prime Generator',
      'location': 'Trans-Amadi Logistics Yard',
      'cost': '₦145,000',
      'status': 'completed',
      'date': '2026-10-28',
      'notes': 'Oil filters, fuel water separator, and 15W40 synthetic oil replaced.',
    },
    {
      'id': 'mnt-002',
      'title': 'VRV Central AC Compressor Inspection',
      'asset': 'Daikin VRV Central AC Chiller',
      'location': 'Old GRA Corporate Suites',
      'cost': '₦85,000',
      'status': 'in_progress',
      'date': '2026-11-06',
      'notes': 'Checking low-pressure switch trip on circuit 2.',
    },
  ];

  void _showLogFaultDialog() {
    final titleCtrl = TextEditingController();
    final costCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

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
                'Log Maintenance / Report Fault',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: EasyLifeColors.navy900,
                ),
              ),
              const SizedBox(height: 16),
              EasyTextField(
                label: 'Maintenance Title',
                hint: 'e.g. Submersible borehole pump failure',
                controller: titleCtrl,
              ),
              const SizedBox(height: 12),
              EasyTextField(
                label: 'Estimated or Actual Cost (₦)',
                hint: 'e.g. 65000',
                controller: costCtrl,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              EasyTextField(
                label: 'Technical Notes / Work Done',
                hint: 'Describe replaced parts or scheduled work...',
                controller: notesCtrl,
                maxLines: 3,
              ),
              const SizedBox(height: 20),
              EasyButton(
                label: 'Save Maintenance Record',
                onPressed: () {
                  if (titleCtrl.text.trim().isEmpty) return;
                  Navigator.pop(ctx);
                  setState(() {
                    _records.insert(0, {
                      'id': 'mnt-${DateTime.now().millisecondsSinceEpoch}',
                      'title': titleCtrl.text,
                      'asset': 'General Facility Equipment',
                      'location': 'Port Harcourt Facility',
                      'cost': '₦${costCtrl.text.isNotEmpty ? costCtrl.text : "Pending"}',
                      'status': 'in_progress',
                      'date': DateTime.now().toString().split(' ')[0],
                      'notes': notesCtrl.text,
                    });
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Maintenance record logged successfully!'),
                      backgroundColor: EasyLifeColors.teal600,
                    ),
                  );
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
        title: const Text('Maintenance Records'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Log Maintenance',
            onPressed: _showLogFaultDialog,
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _records.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final m = _records[index];
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
                      m['date'],
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: EasyLifeColors.charcoal500,
                      ),
                    ),
                    StatusChip(status: m['status']),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  m['title'],
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: EasyLifeColors.navy900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${m['asset']} • ${m['location']}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: EasyLifeColors.teal700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (m['notes'] != null && (m['notes'] as String).isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    m['notes'],
                    style: const TextStyle(
                      fontSize: 12,
                      color: EasyLifeColors.charcoal600,
                      height: 1.3,
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                const Divider(color: EasyLifeColors.borderGrey, height: 1),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Recorded Expense:',
                      style: TextStyle(fontSize: 12, color: EasyLifeColors.charcoal600),
                    ),
                    Text(
                      m['cost'],
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: EasyLifeColors.navy900,
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
        onPressed: _showLogFaultDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}
