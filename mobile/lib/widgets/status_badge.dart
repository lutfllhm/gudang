import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../utils/status_groups.dart';

/// Badge status dengan glow berdenyut, mirip class Tailwind
/// `animate-neon-pulse-*` yang dipakai di frontend/src/pages/SchedulePage.jsx.
class StatusBadge extends StatelessWidget {
  final String? status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final colors = getStatusColors(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colors.bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: colors.border),
      ),
      child: Text(
        formatStatusLabel(status),
        style: TextStyle(color: colors.text, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .custom(
          duration: const Duration(milliseconds: 1200),
          curve: Curves.easeInOut,
          builder: (context, value, child) => DecoratedBox(
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: AppColors.badgeBorder(colors.text).withValues(alpha: 0.15 + value * 0.25),
                  blurRadius: 4 + value * 6,
                  spreadRadius: value * 1.5,
                ),
              ],
            ),
            child: child,
          ),
        );
  }
}
