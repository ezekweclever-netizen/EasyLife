import 'package:flutter/material.dart';
import '../theme/easylife_theme.dart';

class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color text;
    final String label = status.replaceAll('_', ' ').toUpperCase();

    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'confirmed':
      case 'operational':
      case 'accepted':
      case 'successful':
        bg = EasyLifeColors.successBg;
        text = EasyLifeColors.successText;
        break;
      case 'pending':
      case 'under_review':
      case 'completion_requested':
      case 'under_maintenance':
        bg = EasyLifeColors.warningBg;
        text = EasyLifeColors.warningText;
        break;
      case 'rejected':
      case 'disputed':
      case 'failed':
      case 'cancelled':
      case 'faulty':
        bg = EasyLifeColors.errorBg;
        text = EasyLifeColors.errorText;
        break;
      case 'in_progress':
      case 'active':
        bg = EasyLifeColors.infoBg;
        text = EasyLifeColors.infoText;
        break;
      case 'draft':
      default:
        bg = EasyLifeColors.surfaceMutedGrey;
        text = EasyLifeColors.charcoal700;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: text,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
