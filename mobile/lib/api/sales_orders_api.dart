import 'client.dart';
import '../models/sales_order.dart';

const _initialLimit = 5000;
const _maxLimit = 50000;

// Sama seperti fetchOrders di frontend/src/pages/SchedulePage.jsx: ambil
// halaman pertama, lalu kalau totalnya lebih besar dari _initialLimit tapi
// masih di bawah _maxLimit, re-fetch sekali dengan limit = total.
Future<List<SalesOrder>> fetchSalesOrders({required String startDate, required String endDate}) async {
  final firstResponse = await api.get(
    '/sales-orders',
    queryParameters: {
      'page': 1,
      'limit': _initialLimit,
      'startDate': startDate,
      'endDate': endDate,
      'includePendingPrior': true,
    },
  );

  if (firstResponse.data['success'] != true) {
    throw Exception('Unexpected response structure from /sales-orders');
  }

  final firstOrdersRaw = (firstResponse.data['data'] as List?) ?? [];
  final total = (firstResponse.data['pagination']?['total'] as num?)?.toInt() ?? firstOrdersRaw.length;

  List<dynamic> ordersRaw = firstOrdersRaw;

  if (total > _initialLimit && total <= _maxLimit) {
    final secondResponse = await api.get(
      '/sales-orders',
      queryParameters: {
        'page': 1,
        'limit': total,
        'startDate': startDate,
        'endDate': endDate,
        'includePendingPrior': true,
      },
    );
    if (secondResponse.data['success'] == true && secondResponse.data['data'] is List) {
      ordersRaw = secondResponse.data['data'] as List;
    }
  }

  return ordersRaw.map((json) => SalesOrder.fromJson(json as Map<String, dynamic>)).toList();
}
