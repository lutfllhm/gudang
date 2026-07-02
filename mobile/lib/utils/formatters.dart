import 'package:intl/intl.dart';

final _currencyFormat = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp', decimalDigits: 0);
final _dateFormat = DateFormat('dd MMM yyyy', 'id_ID');

String formatCurrency(num? amount) => _currencyFormat.format(amount ?? 0);

String formatDate(DateTime? date) {
  if (date == null) return '—';
  return _dateFormat.format(date);
}
