class SalesOrder {
  final String id;
  final String transNumber;
  final String customerName;
  final DateTime? transDate;
  final num totalAmount;
  final String status;
  final String? description;
  final String? invoiceCreatedBy;
  final DateTime? createdAt;
  final DateTime? lastSync;

  SalesOrder({
    required this.id,
    required this.transNumber,
    required this.customerName,
    required this.transDate,
    required this.totalAmount,
    required this.status,
    this.description,
    this.invoiceCreatedBy,
    this.createdAt,
    this.lastSync,
  });

  factory SalesOrder.fromJson(Map<String, dynamic> json) {
    final rawDate = json['transDate'] ?? json['tanggal_so'];
    final rawCreatedAt = json['createdAt'] ?? json['created_at'];
    final rawLastSync = json['lastSync'] ?? json['last_sync'];
    return SalesOrder(
      id: (json['so_id'] ?? json['id'] ?? json['transNumber'] ?? '').toString(),
      transNumber: (json['transNumber'] ?? json['nomor_so'] ?? '').toString(),
      customerName: (json['customerName'] ?? json['nama_pelanggan'] ?? '—').toString(),
      transDate: rawDate != null ? DateTime.tryParse(rawDate.toString()) : null,
      totalAmount: (json['totalAmount'] ?? json['total_amount'] ?? 0) as num,
      status: (json['status'] ?? '').toString(),
      description: (json['description'] ?? json['keterangan'])?.toString(),
      invoiceCreatedBy: (json['invoiceCreatedBy'] ?? json['invoice_created_by'])?.toString(),
      createdAt: rawCreatedAt != null ? DateTime.tryParse(rawCreatedAt.toString()) : null,
      lastSync: rawLastSync != null ? DateTime.tryParse(rawLastSync.toString()) : null,
    );
  }

  /// Waktu SO mengikuti waktu tersimpan/sync ke DB, sama seperti
  /// getOrderTimeValue di frontend/src/pages/SchedulePage.jsx.
  DateTime? get timeValue => createdAt ?? lastSync ?? transDate;
}
