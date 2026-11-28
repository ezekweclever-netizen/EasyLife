import 'package:flutter/material.dart';

/// Official EasyLife Brand Design Tokens & ThemeData for Flutter (Android & iOS)
/// Option C — Harbor Teal & Coral Palette
/// Mirrors `packages/shared-config/src/design-tokens.ts`.
class EasyLifeColors {
  EasyLifeColors._();

  // Centralized EasyLife Global Design System Foundation
  static const Color charcoal = Color(0xFF1F2328);
  static const Color steelGrey = Color(0xFF4A525C);
  static const Color burntOrange = Color(0xFFE8590C);
  static const Color orangeHover = Color(0xFFC84A06);
  static const Color peach = Color(0xFFFCEBDD);
  static const Color cream = Color(0xFFFAF7F3);
  static const Color white = Color(0xFFFFFFFF);
  static const Color borders = Color(0xFFE6E0D8);
  static const Color darkSurfaceText = Color(0xFFFAF7F3);
  static const Color secondaryDarkText = Color(0xFFC3C8CF);

  // Semantic Status Colors
  static const Color semanticSuccess = Color(0xFF2E7D4F);
  static const Color semanticWarning = Color(0xFFB7791F);
  static const Color semanticError = Color(0xFFC53030);
  static const Color semanticInfo = Color(0xFF4A525C);

  // Core Brand & Functional Role Tokens
  static const Color primary = burntOrange;
  static const Color primaryDark = orangeHover;
  static const Color primaryHover = orangeHover;
  static const Color secondary = steelGrey;
  static const Color secondaryHover = charcoal;
  static const Color accent = burntOrange;
  static const Color accentHover = orangeHover;
  static const Color accentSoft = peach;
  static const Color background = cream;
  static const Color surface = white;
  static const Color text = charcoal;
  static const Color textSecondary = steelGrey;
  static const Color muted = steelGrey;
  static const Color border = borders;
  static const Color borderStrong = secondaryDarkText;

  // Stage 5 Dark Mode Foundation Tokens
  static const Color darkBackground = Color(0xFF15181C);
  static const Color darkSurface = Color(0xFF1F2328);
  static const Color darkPrimaryText = Color(0xFFFAF7F3);
  static const Color darkSecondaryText = Color(0xFFC3C8CF);
  static const Color darkAccent = Color(0xFFF06A1F);
  static const Color darkBorder = Color(0xFF2E343B);

  // Legacy mappings for backwards-compatibility across existing screens
  static const Color navy950 = Color(0xFF14171A);
  static const Color navy900 = Color(0xFF1F2328);
  static const Color navy800 = Color(0xFF262B32);
  static const Color navy700 = Color(0xFF353B44);

  static const Color teal800 = Color(0xFFC84A06);
  static const Color teal700 = Color(0xFFC84A06);
  static const Color teal600 = Color(0xFFE8590C);
  static const Color teal500 = Color(0xFFE8590C);
  static const Color teal50 = Color(0xFFFAF7F3);

  static const Color charcoal900 = Color(0xFF14171A);
  static const Color charcoal800 = Color(0xFF1F2328);
  static const Color charcoal700 = Color(0xFF353B44);
  static const Color charcoal600 = Color(0xFF4A525C);
  static const Color charcoal500 = Color(0xFF6B7582);
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color surfaceLightGrey = Color(0xFFFAF7F3);
  static const Color surfaceMutedGrey = Color(0xFFF2EDE6);
  static const Color borderGrey = Color(0xFFE6E0D8);
  static const Color strongBorder = Color(0xFFC3C8CF);

  // Semantic Status Colors (WCAG AAA / AA Accessible)
  static const Color successText = semanticSuccess;
  static const Color successBg = Color(0xFFE8F5ED);
  static const Color warningText = semanticWarning;
  static const Color warningBg = Color(0xFFFEF7EC);
  static const Color errorText = semanticError;
  static const Color errorBg = Color(0xFFFDE8E8);
  static const Color infoText = semanticInfo;
  static const Color infoBg = Color(0xFFEBF0F5);
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

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'General Sans',
      scaffoldBackgroundColor: EasyLifeColors.darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: EasyLifeColors.darkAccent,
        onPrimary: Colors.white,
        secondary: EasyLifeColors.darkSecondaryText,
        onSecondary: EasyLifeColors.darkBackground,
        tertiary: EasyLifeColors.darkAccent,
        onTertiary: Colors.white,
        surface: EasyLifeColors.darkSurface,
        onSurface: EasyLifeColors.darkPrimaryText,
        error: EasyLifeColors.errorText,
        onError: Colors.white,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: EasyLifeColors.darkSurface,
        foregroundColor: EasyLifeColors.darkPrimaryText,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'General Sans',
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: EasyLifeColors.darkPrimaryText,
        ),
      ),
      cardTheme: CardThemeData(
        color: EasyLifeColors.darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: EasyLifeColors.darkBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: EasyLifeColors.darkAccent,
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
          foregroundColor: EasyLifeColors.darkPrimaryText,
          side: const BorderSide(color: EasyLifeColors.darkBorder, width: 1.5),
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
        fillColor: EasyLifeColors.darkSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.darkAccent, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: EasyLifeColors.errorText),
        ),
        labelStyle: const TextStyle(
          fontFamily: 'General Sans',
          color: EasyLifeColors.darkSecondaryText,
        ),
        hintStyle: const TextStyle(
          fontFamily: 'General Sans',
          color: EasyLifeColors.darkSecondaryText,
        ),
      ),
    );
  }
}
