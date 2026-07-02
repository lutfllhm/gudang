import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Mirip pola framer-motion `initial={{opacity:0,y:offsetY}} animate={{opacity:1,y:0}}`
/// yang dipakai di frontend/src/pages/SchedulePage.jsx untuk entrance section/card.
class FadeSlideIn extends StatelessWidget {
  final Widget child;
  final Duration delay;
  final Duration duration;
  final double offsetY;
  final double startScale;

  const FadeSlideIn({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 350),
    this.offsetY = 8,
    this.startScale = 1.0,
  });

  @override
  Widget build(BuildContext context) {
    var effect = child
        .animate(delay: delay)
        .fadeIn(duration: duration, curve: Curves.easeOut)
        .slideY(
          begin: offsetY / 100,
          end: 0,
          duration: duration,
          curve: Curves.easeOut,
        );
    if (startScale != 1.0) {
      effect = effect.scale(
        begin: Offset(startScale, startScale),
        end: const Offset(1, 1),
        duration: duration,
        curve: Curves.easeOut,
      );
    }
    return effect;
  }
}
