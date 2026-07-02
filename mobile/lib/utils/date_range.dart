// Port dari frontend/src/pages/SchedulePage.jsx.
String toYyyyMm(DateTime d) {
  final mm = d.month.toString().padLeft(2, '0');
  return '${d.year}-$mm';
}

class MonthRange {
  final String startDate;
  final String endDate;
  MonthRange(this.startDate, this.endDate);
}

MonthRange getMonthRange(String yyyyMm) {
  final parts = yyyyMm.split('-');
  final y = int.parse(parts[0]);
  final m = int.parse(parts[1]);
  final start = DateTime(y, m, 1);
  final end = DateTime(y, m + 1, 0);
  String toIsoDate(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  return MonthRange(toIsoDate(start), toIsoDate(end));
}
