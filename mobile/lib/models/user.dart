class AppUser {
  final String id;
  final String nama;
  final String email;
  final String role;

  AppUser({required this.id, required this.nama, required this.email, required this.role});

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'].toString(),
      nama: json['nama'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'nama': nama, 'email': email, 'role': role};
}
