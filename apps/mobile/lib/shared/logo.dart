import 'package:flutter/material.dart';
import '../theme/easylife_theme.dart';

/// Refreshed EasyLife Brand Lockup & Monogram Emblem for Flutter
/// Ensures "Everyday Problems. Smarter Solutions." appears directly beneath the EasyLife name.
class EasyLifeBrandLockup extends StatelessWidget {
  final bool isDark;
  final double size;
  final bool showSlogan;

  const EasyLifeBrandLockup({
    super.key,
    this.isDark = true,
    this.size = 32,
    this.showSlogan = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Refreshed Monogram Symbol
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark
                  ? [EasyLifeColors.secondary, EasyLifeColors.primary]
                  : [EasyLifeColors.primary, EasyLifeColors.primaryDark],
            ),
            borderRadius: BorderRadius.circular(size * 0.28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.12),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Stack(
            children: [
              CustomPaint(
                size: Size(size, size),
                painter: _EasyLifeSymbolPainter(),
              ),
              // Coral Solution Spark
              Positioned(
                top: size * 0.22,
                right: size * 0.18,
                child: Container(
                  width: size * 0.16,
                  height: size * 0.16,
                  decoration: const BoxDecoration(
                    color: EasyLifeColors.accent,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        // Wordmark and Slogan Lockup
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            RichText(
              text: TextSpan(
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: size * 0.52,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                  color: isDark ? Colors.white : EasyLifeColors.primary,
                ),
                children: const [
                  TextSpan(text: 'Easy'),
                  TextSpan(
                    text: 'Life',
                    style: TextStyle(
                      color: EasyLifeColors.secondary,
                    ),
                  ),
                ],
              ),
            ),
            if (showSlogan) ...[
              const SizedBox(height: 1.5),
              Text(
                'Everyday Problems. Smarter Solutions.',
                style: TextStyle(
                  fontFamily: 'General Sans',
                  fontSize: size * 0.29,
                  fontWeight: FontWeight.w600,
                  color: isDark ? const Color(0xFFDAE7E7) : EasyLifeColors.muted,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _EasyLifeSymbolPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final whitePaint = Paint()
      ..color = Colors.white
      ..strokeWidth = size.width * 0.08
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final tealPaint = Paint()
      ..color = EasyLifeColors.burntOrange
      ..strokeWidth = size.width * 0.085
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    final w = size.width;
    final h = size.height;

    // Architectural "E" and "L" ease paths
    final pathE = Path()
      ..moveTo(w * 0.26, h * 0.32)
      ..lineTo(w * 0.60, h * 0.32)
      ..moveTo(w * 0.26, h * 0.50)
      ..lineTo(w * 0.52, h * 0.50)
      ..moveTo(w * 0.26, h * 0.68)
      ..lineTo(w * 0.72, h * 0.68)
      ..moveTo(w * 0.26, h * 0.32)
      ..lineTo(w * 0.26, h * 0.68);

    canvas.drawPath(pathE, whitePaint);

    // Upward solution curve
    final pathSolution = Path()
      ..moveTo(w * 0.46, h * 0.60)
      ..lineTo(w * 0.58, h * 0.68)
      ..lineTo(w * 0.76, h * 0.38);

    canvas.drawPath(pathSolution, tealPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
