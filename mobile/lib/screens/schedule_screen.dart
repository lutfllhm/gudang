import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/sales_orders_api.dart';
import '../models/sales_order.dart';
import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import '../utils/date_range.dart';
import '../utils/formatters.dart';
import '../utils/status_groups.dart';
import '../widgets/fade_slide_in.dart';
import '../widgets/pressable_scale.dart';
import '../widgets/status_badge.dart';

const _autoRefreshInterval = Duration(seconds: 30);
const _maxStaggeredCards = 15;

const _filters = [
  {'key': 'active', 'label': 'Active'},
  {'key': 'all', 'label': 'Semua'},
  {'key': 'pending', 'label': 'Pending'},
  {'key': 'processing', 'label': 'Diproses'},
  {'key': 'completed', 'label': 'Selesai'},
];

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  List<SalesOrder> _orders = [];
  bool _loading = true;
  String? _error;
  String _filterStatus = 'active';
  Timer? _timer;
  bool _hasAnimatedIn = false;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(_autoRefreshInterval, (_) => _load(silent: true));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final month = toYyyyMm(DateTime.now());
      final range = getMonthRange(month);
      final data = await fetchSalesOrders(startDate: range.startDate, endDate: range.endDate);
      if (!mounted) return;
      setState(() {
        _orders = data;
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Gagal memuat data sales order');
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _hasAnimatedIn = true;
        });
      }
    }
  }

  Map<String, int> get _stats {
    final counter = {'total': _orders.length, 'pending': 0, 'processing': 0, 'completed': 0};
    for (final o in _orders) {
      final group = getOrderStatusGroup(o.status);
      if (group == 'pending') counter['pending'] = counter['pending']! + 1;
      if (group == 'processing') counter['processing'] = counter['processing']! + 1;
      if (group == 'completed') counter['completed'] = counter['completed']! + 1;
    }
    return counter;
  }

  List<SalesOrder> get _filteredOrders {
    var list = _orders.where((o) {
      if (_filterStatus == 'all') return true;
      final group = getOrderStatusGroup(o.status);
      if (_filterStatus == 'active') return group == 'pending' || group == 'processing';
      return group == _filterStatus;
    }).toList();
    list.sort((a, b) => (b.transDate ?? DateTime(0)).compareTo(a.transDate ?? DateTime(0)));
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final stats = _stats;
    final filtered = _filteredOrders;
    final animateHeader = !_hasAnimatedIn;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _wrapEntrance(_buildHeader(), animateHeader, 0),
            _wrapEntrance(_buildStatsRow(stats), animateHeader, 60),
            _wrapEntrance(_buildFilterRow(), animateHeader, 120),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 13)),
              ),
            Expanded(
              child: RefreshIndicator(
                color: AppColors.cyan,
                onRefresh: () => _load(silent: true),
                child: filtered.isEmpty && !_loading
                    ? ListView(
                        children: const [
                          SizedBox(height: 60),
                          Center(
                            child: Text(
                              'Tidak ada sales order',
                              style: TextStyle(color: AppColors.textDim, fontSize: 14),
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final card = _OrderCard(order: filtered[index]);
                          if (index >= _maxStaggeredCards) return card;
                          return FadeSlideIn(
                            delay: Duration(milliseconds: index * 30),
                            child: card,
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _wrapEntrance(Widget child, bool animate, int delayMs) {
    if (!animate) return child;
    return FadeSlideIn(delay: Duration(milliseconds: delayMs), child: child);
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Schedule Board',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold),
              ),
              Text(
                '${_orders.length} SO bulan ini',
                style: const TextStyle(color: AppColors.textFaint, fontSize: 12),
              ),
            ],
          ),
          PressableScale(
            onTap: () => context.read<AuthProvider>().logout(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.borderStrong),
              ),
              child: const Text(
                'Keluar',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(Map<String, int> stats) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _StatCard(label: 'Total', value: stats['total']!, color: AppColors.cyan),
          const SizedBox(width: 8),
          _StatCard(label: 'Pending', value: stats['pending']!, color: AppColors.red),
          const SizedBox(width: 8),
          _StatCard(label: 'Diproses', value: stats['processing']!, color: AppColors.amber),
          const SizedBox(width: 8),
          _StatCard(label: 'Selesai', value: stats['completed']!, color: AppColors.emerald),
        ],
      ),
    );
  }

  Widget _buildFilterRow() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: _filters.map((f) {
          final active = _filterStatus == f['key'];
          return PressableScale(
            onTap: () => setState(() => _filterStatus = f['key']!),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: active ? AppColors.cyanChip : AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: active ? AppColors.cyan : AppColors.border),
              ),
              child: Text(
                f['label']!,
                style: TextStyle(
                  color: active ? AppColors.cyanLight : AppColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text('$value', style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppColors.textFaint, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final SalesOrder order;

  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                order.transNumber.isEmpty ? '—' : order.transNumber,
                style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              StatusBadge(status: order.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(order.customerName, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(formatDate(order.transDate), style: const TextStyle(color: AppColors.textFaint, fontSize: 12)),
              Text(
                formatCurrency(order.totalAmount),
                style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
