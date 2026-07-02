import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';

enum BannerTone { cyan, red }

/// Padanan mobile untuk toast "SO Baru" dan banner overdue reminder di
/// frontend/src/pages/SchedulePage.jsx. Auto dismiss via [autoDismissAfter]
/// jika diisi (mis. toast SO baru, 15 detik); jika null banner persisten
/// sampai ditutup manual (mis. reminder overdue).
class NotificationBanner extends StatefulWidget {
  final BannerTone tone;
  final String eyebrow;
  final String title;
  final String? subtitle;
  final IconData icon;
  final Duration? autoDismissAfter;
  final VoidCallback? onDismiss;

  const NotificationBanner({
    super.key,
    required this.tone,
    required this.eyebrow,
    required this.title,
    this.subtitle,
    required this.icon,
    this.autoDismissAfter,
    this.onDismiss,
  });

  @override
  State<NotificationBanner> createState() => _NotificationBannerState();
}

class _NotificationBannerState extends State<NotificationBanner> {
  Color get _accent => widget.tone == BannerTone.cyan ? AppColors.cyan : AppColors.red;

  @override
  Widget build(BuildContext context) {
    final accent = _accent;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.badgeBorder(accent)),
        gradient: LinearGradient(
          colors: [AppColors.badgeBg(accent), AppColors.card],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPulsingIcon(accent),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.eyebrow.toUpperCase(),
                        style: TextStyle(
                          color: accent.withValues(alpha: 0.8),
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.title,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (widget.subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          widget.subtitle!,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: widget.onDismiss,
                  child: const Icon(Icons.close, color: AppColors.textFaint, size: 16),
                ),
              ],
            ),
          ),
          if (widget.autoDismissAfter case final autoDismissAfter?)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 1.0, end: 0.0),
                duration: autoDismissAfter,
                curve: Curves.linear,
                builder: (context, value, _) => FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: value,
                  child: Container(height: 2, color: accent),
                ),
              ),
            ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms, curve: Curves.easeOut).slideY(begin: -0.08, end: 0);
  }

  Widget _buildPulsingIcon(Color accent) {
    return SizedBox(
      width: 28,
      height: 28,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Ring "ping" — membesar & memudar, mirip CSS animate-ping.
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(8)),
          )
              .animate(onPlay: (c) => c.repeat())
              .scaleXY(begin: 1.0, end: 1.4, duration: 1200.ms, curve: Curves.easeOut)
              .fadeOut(begin: 0.3, duration: 1200.ms, curve: Curves.easeOut),
          // Ikon solid, statis.
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.badgeBg(accent),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.badgeBorder(accent)),
            ),
            child: Icon(widget.icon, color: accent, size: 15),
          ),
        ],
      ),
    );
  }
}
