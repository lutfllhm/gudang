import 'package:flutter/material.dart';

// Palet warna dari frontend/src/pages/SchedulePage.jsx agar mobile & web konsisten.
class AppColors {
  AppColors._();

  static const background = Color(0xFF020617);
  static const card = Color(0xFF0f172a);
  static const border = Color(0xFF1e293b);
  static const borderStrong = Color(0xFF334155);

  static const textPrimary = Color(0xFFf1f5f9);
  static const textSecondary = Color(0xFFcbd5e1);
  static const textMuted = Color(0xFF94a3b8);
  static const textFaint = Color(0xFF64748b);
  static const textDim = Color(0xFF475569);

  static const cyan = Color(0xFF22d3ee);
  static const cyanLight = Color(0xFF67e8f9);
  static const cyanChip = Color(0xFF164e63);

  static const emerald = Color(0xFF34d399);
  static const amber = Color(0xFFfbbf24);
  static const red = Color(0xFFf87171);
  static const slate = Color(0xFF94a3b8);

  // ~15% alpha, mirip Tailwind bg-*-500/15 dipakai untuk badge status.
  static Color badgeBg(Color c) => c.withValues(alpha: 0.15);

  // ~40% alpha, mirip Tailwind border-*-400/40.
  static Color badgeBorder(Color c) => c.withValues(alpha: 0.4);
}
