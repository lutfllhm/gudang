import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

// Port dari frontend/src/pages/SchedulePage.jsx (STATUS_GROUP + helper terkait).
// Status label baku dari Accurate Online (disimpan persis di DB):
// "Terproses", "Sebagian diproses", "Menunggu diproses"
class StatusGroups {
  static const completed = [
    'terproses',
    'selesai',
    'completed',
    'closed',
    'close',
    'finished',
    'done',
    'fully processed',
  ];
  static const processing = [
    'sebagian diproses',
    'sebagian terproses',
    'sebagian_diproses',
    'sebagian_terproses',
    'processing',
    'partial',
    'partially',
    'in progress',
    'in_progress',
    'partially processed',
    'partially_processed',
  ];
  static const pending = [
    'menunggu diproses',
    'menunggu proses',
    'menunggu_diproses',
    'pending',
    'belum terproses',
    'dipesan',
    'queue',
    'waiting',
    'open',
    'opened',
    'new',
    'draft',
  ];
}

String getOrderStatusGroup(String? status) {
  final s = (status ?? '').toLowerCase().trim();
  if (StatusGroups.completed.any((x) => s.contains(x))) return 'completed';
  if (StatusGroups.processing.any((x) => s.contains(x))) return 'processing';
  if (StatusGroups.pending.any((x) => s.contains(x))) return 'pending';
  return 'other';
}

class StatusColors {
  final Color bg;
  final Color text;
  final Color border;
  const StatusColors({required this.bg, required this.text, required this.border});
}

StatusColors getStatusColors(String? status) {
  final s = (status ?? '').toLowerCase().trim();

  if (StatusGroups.completed.any((x) => s == x || s.contains(x))) {
    return StatusColors(
      bg: AppColors.badgeBg(AppColors.emerald),
      text: AppColors.emerald,
      border: AppColors.badgeBorder(AppColors.emerald),
    );
  }
  if (StatusGroups.processing.any((x) => s == x || s.contains(x))) {
    return StatusColors(
      bg: AppColors.badgeBg(AppColors.amber),
      text: AppColors.amber,
      border: AppColors.badgeBorder(AppColors.amber),
    );
  }
  if (StatusGroups.pending.any((x) => s == x || s.contains(x))) {
    return StatusColors(
      bg: AppColors.badgeBg(AppColors.red),
      text: AppColors.red,
      border: AppColors.badgeBorder(AppColors.red),
    );
  }
  if (s == 'cancelled' || s == 'batal') {
    return StatusColors(
      bg: AppColors.badgeBg(AppColors.slate),
      text: AppColors.slate,
      border: AppColors.badgeBorder(AppColors.slate),
    );
  }
  return StatusColors(
    bg: AppColors.badgeBg(AppColors.cyan),
    text: AppColors.cyan,
    border: AppColors.badgeBorder(AppColors.cyan),
  );
}

String formatStatusLabel(String? status) {
  final s = (status ?? '').toLowerCase().trim();

  if (StatusGroups.completed.any((x) => s == x || s.contains(x))) return 'Terproses';
  if (StatusGroups.processing.any((x) => s == x || s.contains(x))) return 'Sebagian diproses';
  if (StatusGroups.pending.any((x) => s == x || s.contains(x))) return 'Menunggu diproses';
  if (s == 'cancelled' || s == 'batal') return 'Batal';
  return (status == null || status.isEmpty) ? '—' : status;
}
