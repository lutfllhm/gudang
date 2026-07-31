import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api/sales_orders_api.dart';
import '../api/socket_service.dart';
import '../models/sales_order.dart';
import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import '../utils/date_range.dart';
import '../utils/formatters.dart';
import '../utils/status_groups.dart';
import '../widgets/auto_scroll_list.dart';
import '../widgets/fade_slide_in.dart';
import '../widgets/notification_banner.dart';
import '../widgets/pressable_scale.dart';
import '../widgets/status_badge.dart';

const _autoRefreshInterval = Duration(seconds: 30);
const _toastDuration = Duration(seconds: 6);

const _filters = [
  {'key': 'active', 'label': 'Aktif'},
  {'key': 'all', 'label': 'Semua'},
  {'key': 'pending', 'label': 'Menunggu'},
  {'key': 'processing', 'label': 'Sebagian'},
  {'key': 'completed', 'label': 'Selesai'},
];

// Lebar kolom tabel (belum di-scale), meniru gridTemplateColumns di
// frontend/src/pages/SchedulePage.jsx: '80px 180px 120px 1fr 200px 160px'.
const _colTime = 60.0;
const _colSo = 150.0;
const _colDate = 100.0;
const _colCustomer = 180.0;
const _colDescription = 200.0;
const _colStatus = 170.0;

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
  Timer? _clockTimer;
  bool _hasAnimatedIn = false;
  DateTime _now = DateTime.now();

  io.Socket? _socket;
  String? _newSoToast;
  Timer? _toastTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(_autoRefreshInterval, (_) => _load(silent: true));
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
    _connectSocket();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _clockTimer?.cancel();
    _toastTimer?.cancel();
    _socket?.dispose();
    super.dispose();
  }

  void _connectSocket() {
    final userId = context.read<AuthProvider>().user?.id;
    _socket = createSalesOrderSocket(userId: userId)
      ..on('sales_order:new', (payload) => _handleIncomingOrder(payload, isNew: true))
      ..on('sales_order:updated', (payload) => _handleIncomingOrder(payload, isNew: false));
  }

  void _handleIncomingOrder(dynamic payload, {required bool isNew}) {
    if (!mounted) return;
    final raw = payload is Map ? payload['data'] : null;
    if (raw is! Map) return;

    final incoming = SalesOrder.fromJson(Map<String, dynamic>.from(raw));

    setState(() {
      final index = _orders.indexWhere((o) => o.id == incoming.id);
      if (index >= 0) {
        _orders[index] = incoming;
      } else {
        _orders = [..._orders, incoming];
      }
    });

    if (isNew) _showNewSoToast(incoming);
  }

  void _showNewSoToast(SalesOrder order) {
    _toastTimer?.cancel();
    setState(() {
      _newSoToast = order.transNumber.isEmpty ? order.customerName : order.transNumber;
    });
    _toastTimer = Timer(_toastDuration, () {
      if (mounted) setState(() => _newSoToast = null);
    });
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
    final layout = _BoardLayout.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _wrapEntrance(_buildHeader(layout), animateHeader, 0),
            if (_newSoToast != null)
              Padding(
                padding: EdgeInsets.fromLTRB(layout.gutter, 0, layout.gutter, 8),
                child: NotificationBanner(
                  key: ValueKey(_newSoToast),
                  tone: BannerTone.cyan,
                  eyebrow: 'SO Baru',
                  title: _newSoToast!,
                  icon: Icons.assignment_outlined,
                  autoDismissAfter: _toastDuration,
                  onDismiss: () {
                    _toastTimer?.cancel();
                    setState(() => _newSoToast = null);
                  },
                ),
              ),
            _wrapEntrance(_buildStatsRow(stats, layout), animateHeader, 60),
            _wrapEntrance(_buildFilterRow(layout), animateHeader, 120),
            if (_error != null)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: layout.gutter, vertical: 4),
                child: Text(
                  _error!,
                  style: TextStyle(color: AppColors.red, fontSize: layout.scale(13)),
                ),
              ),
            Expanded(
              child: Padding(
                padding: EdgeInsets.fromLTRB(layout.gutter, 0, layout.gutter, layout.vgap(layout.gutter)),
                child: _buildTable(filtered, layout),
              ),
            ),
            _buildFooter(filtered.length, layout),
          ],
        ),
      ),
    );
  }

  Widget _wrapEntrance(Widget child, bool animate, int delayMs) {
    if (!animate) return child;
    return FadeSlideIn(delay: Duration(milliseconds: delayMs), child: child);
  }

  Widget _buildHeader(_BoardLayout layout) {
    return Padding(
      padding: EdgeInsets.fromLTRB(layout.gutter, layout.vgap(12), layout.gutter, layout.vgap(8)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.asset(
              'assets/images/mlogo.png',
              width: layout.scale(32),
              height: layout.scale(32),
            ),
          ),
          SizedBox(width: layout.scale(10)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'WAREHOUSE CONTROL',
                  style: TextStyle(
                    color: AppColors.textFaint,
                    fontSize: layout.scale(10),
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                SizedBox(height: layout.scale(2)),
                Text(
                  'Schedule Board',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: layout.scale(20),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: layout.scale(2)),
                Row(
                  children: [
                    Container(
                      width: layout.scale(6),
                      height: layout.scale(6),
                      decoration: const BoxDecoration(color: AppColors.emerald, shape: BoxShape.circle),
                    ),
                    SizedBox(width: layout.scale(5)),
                    Text(
                      'Live · ${_orders.length} SO bulan ini',
                      style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(11)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${_now.hour.toString().padLeft(2, '0')}:${_now.minute.toString().padLeft(2, '0')}',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: layout.scale(22),
                      fontWeight: FontWeight.w700,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  SizedBox(width: layout.scale(8)),
                  PressableScale(
                    onTap: () => context.read<AuthProvider>().logout(),
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: layout.scale(12),
                        vertical: layout.scale(6),
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.borderStrong),
                      ),
                      child: Text(
                        'Keluar',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: layout.scale(12),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: layout.scale(2)),
              Text(
                formatDate(_now),
                style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(11)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(Map<String, int> stats, _BoardLayout layout) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: layout.gutter),
      child: Row(
        children: [
          _StatCard(
            label: 'Total',
            value: stats['total']!,
            color: AppColors.cyan,
            icon: Icons.inventory_2_outlined,
            layout: layout,
          ),
          SizedBox(width: layout.scale(8)),
          _StatCard(
            label: 'Pending',
            value: stats['pending']!,
            color: AppColors.red,
            icon: Icons.error_outline,
            layout: layout,
          ),
          SizedBox(width: layout.scale(8)),
          _StatCard(
            label: 'Diproses',
            value: stats['processing']!,
            color: AppColors.amber,
            icon: Icons.bolt_outlined,
            layout: layout,
          ),
          SizedBox(width: layout.scale(8)),
          _StatCard(
            label: 'Selesai',
            value: stats['completed']!,
            color: AppColors.emerald,
            icon: Icons.check_circle_outline,
            layout: layout,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterRow(_BoardLayout layout) {
    return Padding(
      padding: EdgeInsets.fromLTRB(layout.gutter, layout.vgap(12), layout.gutter, layout.vgap(12)),
      child: Wrap(
        spacing: layout.scale(8),
        runSpacing: layout.scale(8),
        children: _filters.map((f) {
          final active = _filterStatus == f['key'];
          return PressableScale(
            onTap: () => setState(() => _filterStatus = f['key']!),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: EdgeInsets.symmetric(horizontal: layout.scale(12), vertical: layout.vgap(6)),
              decoration: BoxDecoration(
                color: active ? AppColors.cyanChip : AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: active ? AppColors.cyan : AppColors.border),
              ),
              child: Text(
                f['label']!,
                style: TextStyle(
                  color: active ? AppColors.cyanLight : AppColors.textMuted,
                  fontSize: layout.scale(12),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTable(List<SalesOrder> filtered, _BoardLayout layout) {
    final tableWidth = layout.tableWidth;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SizedBox(
          width: tableWidth,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _TableHeaderRow(layout: layout),
              Expanded(
                child: _loading
                    ? Center(
                        child: Text(
                          'Memuat schedule…',
                          style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(13)),
                        ),
                      )
                    : filtered.isEmpty
                        ? Center(
                            child: Text(
                              'Tidak ada sales order',
                              style: TextStyle(color: AppColors.textDim, fontSize: layout.scale(14)),
                            ),
                          )
                        : RefreshIndicator(
                            color: AppColors.cyan,
                            onRefresh: () => _load(silent: true),
                            child: AutoScrollList(
                              children: [
                                for (var i = 0; i < filtered.length; i++)
                                  _TableDataRow(order: filtered[i], layout: layout, striped: i.isOdd),
                                // Duplikasi list agar loop auto-scroll terasa mulus tanpa jeda kosong
                                for (var i = 0; i < filtered.length; i++)
                                  _TableDataRow(order: filtered[i], layout: layout, striped: i.isOdd),
                              ],
                            ),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFooter(int shownCount, _BoardLayout layout) {
    return Container(
      margin: EdgeInsets.fromLTRB(layout.gutter, 0, layout.gutter, layout.vgap(layout.gutter)),
      padding: EdgeInsets.symmetric(horizontal: layout.scale(12), vertical: layout.vgap(8)),
      decoration: BoxDecoration(
        color: AppColors.card.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: layout.scale(6),
            height: layout.scale(6),
            decoration: const BoxDecoration(color: AppColors.emerald, shape: BoxShape.circle),
          ),
          SizedBox(width: layout.scale(6)),
          Text('System online', style: TextStyle(color: AppColors.textSecondary, fontSize: layout.scale(11))),
          Text(' · ', style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(11))),
          Text('Auto refresh 30s', style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(11))),
          Text(' · ', style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(11))),
          Expanded(
            child: Text(
              'Menampilkan $shownCount dari ${_orders.length} SO',
              style: TextStyle(color: AppColors.cyan, fontSize: layout.scale(11), fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

/// Menentukan skala font/spacing berdasarkan lebar layar logis. Dipakai agar
/// Schedule Board tetap terbaca saat dijalankan di TV/monitor besar (mis.
/// 43") sebagai papan display, maupun di HP biasa — keduanya memakai tampilan
/// tabel yang sama (mirip frontend/src/pages/SchedulePage.jsx), hanya lebar
/// kolom & scroll horizontal yang berubah di layar sempit.
class _BoardLayout {
  final double gutter;
  final double fontScale;
  // true saat tinggi layar sempit (mis. HP landscape) — header/stats/filter
  // dipadatkan agar area tabel tidak overflow secara vertikal.
  final bool compact;

  const _BoardLayout({required this.gutter, required this.fontScale, this.compact = false});

  factory _BoardLayout.of(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final width = size.width;
    final compact = size.height < 480;

    if (width >= 2400) {
      return _BoardLayout(gutter: 48, fontScale: 2.6, compact: compact);
    } else if (width >= 1600) {
      return _BoardLayout(gutter: 32, fontScale: 1.6, compact: compact);
    } else if (width >= 1100) {
      return _BoardLayout(gutter: 24, fontScale: 1.35, compact: compact);
    } else if (width >= 700) {
      return _BoardLayout(gutter: 20, fontScale: 1.15, compact: compact);
    }
    return _BoardLayout(gutter: 16, fontScale: 1.0, compact: compact);
  }

  double scale(double base) => base * fontScale;

  // Padding/spacing vertikal antar section (header, stats, filter, footer).
  // Dipadatkan di mode compact supaya area tabel tetap kebagian tinggi.
  double vgap(double base) => compact ? base * 0.35 : base;

  // Total lebar kolom + padding horizontal kiri-kanan pada setiap row (lihat
  // _TableHeaderRow/_TableDataRow: padding horizontal = scale(12) per sisi).
  double get tableWidth =>
      scale(_colTime + _colSo + _colDate + _colCustomer + _colDescription + _colStatus) +
      scale(12) * 2;
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final IconData icon;
  final _BoardLayout layout;

  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
    required this.layout,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: layout.scale(10), vertical: layout.vgap(8)),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: layout.scale(28),
              height: layout.scale(28),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: layout.scale(15)),
            ),
            SizedBox(width: layout.scale(8)),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      '$value',
                      style: TextStyle(color: color, fontSize: layout.scale(17), fontWeight: FontWeight.bold),
                    ),
                  ),
                  Text(
                    label,
                    style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(10)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TableHeaderRow extends StatelessWidget {
  final _BoardLayout layout;

  const _TableHeaderRow({required this.layout});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: layout.scale(12), vertical: layout.vgap(10)),
      decoration: BoxDecoration(
        color: AppColors.border.withValues(alpha: 0.6),
        border: const Border(bottom: BorderSide(color: AppColors.borderStrong)),
      ),
      child: Row(
        children: [
          _headerCell('Time', layout.scale(_colTime)),
          _headerCell('SO Number', layout.scale(_colSo)),
          _headerCell('Date', layout.scale(_colDate)),
          _headerCell('Customer', layout.scale(_colCustomer)),
          _headerCell('Description', layout.scale(_colDescription)),
          _headerCell('Status', layout.scale(_colStatus), center: true),
        ],
      ),
    );
  }

  Widget _headerCell(String label, double width, {bool center = false}) {
    return SizedBox(
      width: width,
      child: Text(
        label.toUpperCase(),
        textAlign: center ? TextAlign.center : TextAlign.start,
        style: TextStyle(
          color: AppColors.textSecondary,
          fontSize: layout.scale(11),
          fontWeight: FontWeight.bold,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}

class _TableDataRow extends StatelessWidget {
  final SalesOrder order;
  final _BoardLayout layout;
  final bool striped;

  const _TableDataRow({required this.order, required this.layout, required this.striped});

  @override
  Widget build(BuildContext context) {
    final statusLabel = formatStatusLabel(order.status);
    final showCreator = order.invoiceCreatedBy != null &&
        order.invoiceCreatedBy!.isNotEmpty &&
        (statusLabel == 'Terproses' || statusLabel == 'Sebagian diproses');

    return Container(
      padding: EdgeInsets.symmetric(horizontal: layout.scale(12), vertical: layout.vgap(10)),
      decoration: BoxDecoration(
        color: striped ? AppColors.border.withValues(alpha: 0.2) : Colors.transparent,
        border: const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: layout.scale(_colTime),
            child: Text(
              formatTime(order.timeValue),
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: layout.scale(13),
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          SizedBox(
            width: layout.scale(_colSo),
            child: Text(
              order.transNumber.isEmpty ? '—' : order.transNumber,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: layout.scale(13),
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: layout.scale(_colDate),
            child: Text(
              formatDate(order.transDate),
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: layout.scale(13),
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          SizedBox(
            width: layout.scale(_colCustomer),
            child: Text(
              order.customerName,
              style: TextStyle(color: AppColors.textPrimary, fontSize: layout.scale(13)),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: layout.scale(_colDescription),
            child: Text(
              (order.description != null && order.description!.isNotEmpty)
                  ? order.description!
                  : formatCurrency(order.totalAmount),
              style: TextStyle(color: AppColors.textSecondary, fontSize: layout.scale(13)),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: layout.scale(_colStatus),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: StatusBadge(status: order.status),
                ),
                if (showCreator)
                  Padding(
                    padding: EdgeInsets.only(top: layout.scale(2)),
                    child: Text(
                      'oleh: ${order.invoiceCreatedBy}',
                      style: TextStyle(color: AppColors.textFaint, fontSize: layout.scale(9)),
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
