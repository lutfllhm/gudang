import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import 'client.dart';
import '../models/user.dart';

const _storage = FlutterSecureStorage();

class LoginResult {
  final bool success;
  final AppUser? user;
  final String? message;

  LoginResult.ok(AppUser this.user) : success = true, message = null;
  LoginResult.error(String this.message) : success = false, user = null;
}

Future<LoginResult> login(String email, String password) async {
  try {
    final response = await api.post('/auth/login', data: {'email': email, 'password': password});
    final data = response.data['data'];
    final user = AppUser.fromJson(data['user']);

    await _storage.write(key: TokenKeys.accessToken, value: data['accessToken']);
    await _storage.write(key: TokenKeys.refreshToken, value: data['refreshToken']);
    await _storage.write(key: TokenKeys.user, value: jsonEncode(user.toJson()));

    return LoginResult.ok(user);
  } on DioException catch (e) {
    final message = e.response?.data?['message'] ?? 'Login gagal';
    return LoginResult.error(message.toString());
  } catch (_) {
    return LoginResult.error('Login gagal, periksa koneksi internet');
  }
}

Future<void> logout() async {
  await _storage.delete(key: TokenKeys.accessToken);
  await _storage.delete(key: TokenKeys.refreshToken);
  await _storage.delete(key: TokenKeys.user);
}

Future<AppUser?> getStoredAuth() async {
  final token = await _storage.read(key: TokenKeys.accessToken);
  final savedUser = await _storage.read(key: TokenKeys.user);
  if (token == null || savedUser == null) return null;

  try {
    return AppUser.fromJson(jsonDecode(savedUser));
  } catch (_) {
    return null;
  }
}
