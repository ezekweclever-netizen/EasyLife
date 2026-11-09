import 'package:flutter/material.dart';

/// Official EasyLife Brand Design Tokens & ThemeData for Flutter (Android & iOS)
/// Option C — Harbor Teal & Coral Palette
/// Mirrors `packages/shared-config/src/design-tokens.ts`.
class EasyLifeColors {
  EasyLifeColors._();

  // Core Brand Tokens (Option C — Harbor Teal & Coral)
  static const Color primary = Color(0xFF154752); // Deep Harbor Teal
  static const Color primaryDark = Color(0xFF0D282E); // Darkest Harbor Teal
  static const Color secondary = Color(0xFF24989A); // Maritime Teal
  static const Color secondaryHover = Color(0xFF1D7E80);
  static const Color accent = Color(0xFFEE9277); // Warm Coral Accent
  static const Color background = Color(0xFFF3F8F8); // Airy Pale Teal Canvas
  static const Color surface = Color(0xFFFFFFFF); // Crisp White Surface
  static const Color text = Color(0xFF1F2F34); // Deep Legible Charcoal Teal
  static const Color muted = Color(0xFF68797C); // Balanced Slate Muted Text
  static const Color border = Color(0xFFDAE7E7); // Structural Hairline Border
  static const Color borderStrong = Color(0xFFC2D4D4); // Active Input Border

  // Legacy mappings for backwards-compatibility across existing screens
  static const Color navy950 = Color(0xFF0D282E);
  static const Color navy900 = Color(0xFF154752); // Primary Harbor Teal
  static const Color navy800 = Color(0xFF1A5663);
  static const Color navy700 = Color(0xFF206776);

  static const Color teal800 = Color(0xFF186869);
  static const Color teal700 = Color(0xFF1D7E80);
  static const Color teal600 = Color(0xFF24989A); // Secondary Brand Teal
  static const Color teal500 = Color(0xFF2DC0C2);
  static const Color teal50 = Color(0xFFEEF9F9);

  static const Color charcoal900 = Color(0xFF142024);
  static const Color charcoal800 = Color(0xFF1F2F34);
  static const Color charcoal700 = Color(0xFF35474C);
  static const Color charcoal600 = Color(0xFF4E6065);
  static const Color charcoal500 = Color(0xFF68797C);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color surfaceLightGrey = Color(0xFFF3F8F8);
  static const Color surfaceMutedGrey = Color(0xFFE7F0F0);
  static const Color borderGrey = Color(0xFFDAE7E7);
  static const Color strongBorder = Color(0xFFC2D4D4);

  // Semantic Status Colors (WCAG AAA / AA Accessible)
  static const Color successText = Color(0xFF127A5B);
  static const Color successBg = Color(0xFFE7F7F1);
  static const Color warningText = Color(0xFFB25E0A);
  static const Color warningBg = Color(0xFFFEF5E7);
  static const Color errorText = Color(0xFFC53030);
  static const Color errorBg = Color(0xFFFDF0F0);
  static const Color infoText = Color(0xFF1A6E84);
  static const Color infoBg = Color(0xFFEBF6F9);
}

class EasyLifeTheme {
  EasyLifeTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'General Sans',
      scaffoldBackgroundColor: EasyLifeColors.background,
      colorScheme: const ColorScheme.light(
        primary: EasyLifeColors.secondary,
        onPrimary: Colors.white,
        secondary: EasyLifeColors.primary,
        onSecondary: Colors.white,
        tertiary: EasyLifeColors.accent,
        onTertiary: Colors.white,
        surface: EasyLifeColors.surface,
        onSurface: EasyLifeColors.text,
        error: EasyLifeColors.errorText,
        onError: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: EasyLifeColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'General Sans',
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
      cardTheme: CardThemeData(
        color: EasyLifeColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: EasyLifeColors.border, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: EasyLifeColors.secondary,
          foregroundColor: Colors.white,
          minimumSize: const Size(88, 48),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: 'General Sans',
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: EasyLifeColors.secondary,
          side: const BorderSide(color: EasyLifeColors.border, width: 1.5),
          minimumSize: const Size(88, 48),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: 'General Sans',
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: EasyLifeColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.secondary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.errorText),
        ),
        labelStyle: const TextStyle(
          fontFamily: 'General Sans',
          color: EasyLifeColors.muted,
        ),
        hintStyle: const TextStyle(
          fontFamily: 'General Sans',
          color: EasyLifeColors.muted,
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.bold),
        displayMedium: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.bold),
        displaySmall: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.bold),
        headlineLarge: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.bold),
        headlineSmall: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.bold),
        titleLarge: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.w700),
        titleMedium: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.w600),
        titleSmall: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.normal),
        bodyMedium: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.normal),
        bodySmall: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.normal),
        labelLarge: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.w700),
        labelMedium: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.w600),
        labelSmall: TextStyle(fontFamily: 'General Sans', fontWeight: FontWeight.w500),
      ),
    );
  }
}
