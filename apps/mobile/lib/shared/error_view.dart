import 'package:flutter/material.dart';
import '../theme/easylife_theme.dart';
import 'buttons.dart';

class ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorView({
    super.key,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: EasyLifeColors.errorBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                color: EasyLifeColors.errorText,
                size: 36,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Unable to Load Data',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: EasyLifeColors.navy900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: EasyLifeColors.charcoal600,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 20),
              EasyButton(
                label: 'Try Again',
                icon: Icons.refresh,
                isFullWidth: false,
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
