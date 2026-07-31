import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/scheduler.dart';

const _pxPerSecond = 15.0;
const _resumeDelay = Duration(seconds: 2);

/// List yang otomatis scroll ke bawah terus-menerus dengan kecepatan tetap,
/// meloncat balik ke atas saat sampai akhir. Mirip marquee vertikal di web.
/// Auto-scroll berhenti sementara saat user menyentuh/scroll manual.
class AutoScrollList extends StatefulWidget {
  final List<Widget> children;
  final EdgeInsets padding;

  const AutoScrollList({super.key, required this.children, this.padding = EdgeInsets.zero});

  @override
  State<AutoScrollList> createState() => _AutoScrollListState();
}

class _AutoScrollListState extends State<AutoScrollList> with SingleTickerProviderStateMixin {
  final _scrollController = ScrollController();
  Ticker? _ticker;
  Duration _lastElapsed = Duration.zero;
  bool _userInteracting = false;
  Timer? _resumeTimer;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_onTick)..start();
  }

  @override
  void dispose() {
    _ticker?.dispose();
    _resumeTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  void _onTick(Duration elapsed) {
    if (_userInteracting) {
      _lastElapsed = elapsed;
      return;
    }
    if (!_scrollController.hasClients) {
      _lastElapsed = elapsed;
      return;
    }
    final dt = (elapsed - _lastElapsed).inMilliseconds / 1000.0;
    _lastElapsed = elapsed;

    final position = _scrollController.position;
    final maxScroll = position.maxScrollExtent;
    if (maxScroll <= 0) return;

    var next = position.pixels + _pxPerSecond * dt;
    if (next >= maxScroll) {
      next = 0;
    }
    _scrollController.jumpTo(next);
  }

  void _pauseForUserInteraction() {
    _userInteracting = true;
    _resumeTimer?.cancel();
    _resumeTimer = Timer(_resumeDelay, () {
      if (mounted) _userInteracting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollStartNotification && notification.dragDetails != null) {
          _pauseForUserInteraction();
        } else if (notification is UserScrollNotification &&
            notification.direction != ScrollDirection.idle) {
          _pauseForUserInteraction();
        }
        return false;
      },
      child: ListView(
        controller: _scrollController,
        padding: widget.padding,
        children: widget.children,
      ),
    );
  }
}
