class SalesOrder {
  final String id;
  final String transNumber;
  final String customerName;
  final DateTime? transDate;
  final num totalAmount;
  final String status;

  SalesOrder({
    required this.id,
    required this.transNumber,
    required this.customerName,
    required this.transDate,
    required this.totalAmount,
    required this.status,
  });

  factory SalesOrder.fromJson(Map<String, dynamic> json) {
    final rawDate = json['transDate'] ?? json['tanggal_so'];
    return SalesOrder(
      id: (json['so_id'] ?? json['id'] ?? json['transNumber'] ?? '').toString(),
      transNumber: (json['transNumber'] ?? json['nomor_so'] ?? '').toString(),
      customerName: (json['customerName'] ?? json['nama_pelanggan'] ?? '—').toString(),
      transDate: rawDate != null ? DateTime.tryParse(rawDate.toString()) : null,
      totalAmount: (json['totalAmount'] ?? json['total_amount'] ?? 0) as num,
      status: (json['status'] ?? '').toString(),
    );
  }
}
