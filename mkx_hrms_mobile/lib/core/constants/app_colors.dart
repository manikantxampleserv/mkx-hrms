import 'package:flutter/material.dart';

/// Design tokens and semantic color definitions matching the MKX HRMS design system
class AppColors {
  AppColors._();

  // Neutral Palette - Light Mode
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightForeground = Color(0xFF09090B);
  static const Color lightBorder = Color(0xFFE4E4E7);
  static const Color lightInput = Color(0xFFE4E4E7);
  static const Color lightPrimary = Color(0xFF18181B);
  static const Color lightPrimaryForeground = Color(0xFFFAFAFA);
  static const Color lightSecondary = Color(0xFFF4F4F5);
  static const Color lightSecondaryForeground = Color(0xFF18181B);
  static const Color lightMuted = Color(0xFF71717A);
  static const Color lightMutedBg = Color(0xFFF4F4F5);

  // Neutral Palette - Dark Mode
  static const Color darkBackground = Color(0xFF020203);
  static const Color darkCard = Color(0xFF050607);
  static const Color darkForeground = Color(0xFFEEEEEE);
  static const Color darkBorder = Color(0xFF191B1D);
  static const Color darkInput = Color(0xFF101214);
  static const Color darkPrimary = Color(0xFFEEEEEE);
  static const Color darkPrimaryForeground = Color(0xFF020203);
  static const Color darkSecondary = Color(0xFF101214);
  static const Color darkSecondaryForeground = Color(0xFFEEEEEE);
  static const Color darkMuted = Color(0xFFA1A1AA);
  static const Color darkMutedBg = Color(0xFF101214);

  // Semantic Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color successBgLight = Color(0xFFECFDF5);
  static const Color successBgDark = Color(0xFF062D20);

  static const Color warning = Color(0xFFF59E0B);
  static const Color warningBgLight = Color(0xFFFFFBEB);
  static const Color warningBgDark = Color(0xFF352003);

  static const Color error = Color(0xFFEF4444);
  static const Color errorBgLight = Color(0xFFFEF2F2);
  static const Color errorBgDark = Color(0xFF371212);

  static const Color info = Color(0xFF0EA5E9);
  static const Color infoBgLight = Color(0xFFF0F9FF);
  static const Color infoBgDark = Color(0xFF082F49);

  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleBgLight = Color(0xFFF5F3FF);
  static const Color purpleBgDark = Color(0xFF2E1065);
}
