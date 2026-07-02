import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config.dart';

class TokenKeys {
  static const accessToken = 'accessToken';
  static const refreshToken = 'refreshToken';
  static const user = 'user';
}

const _storage = FlutterSecureStorage();

/// Dipanggil saat refresh token gagal, supaya AuthProvider bisa memicu
/// logout tanpa import langsung ke provider (hindari circular import).
typedef AuthFailureCallback = void Function();
AuthFailureCallback? onAuthFailure;

final Dio api = _buildClient();

Dio _buildClient() {
  final dio = Dio(BaseOptions(baseUrl: apiUrl, headers: {'Content-Type': 'application/json'}));

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: TokenKeys.accessToken);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final isUnauthorized = error.response?.statusCode == 401;
        final alreadyRetried = error.requestOptions.extra['retried'] == true;

        if (isUnauthorized && !alreadyRetried) {
          try {
            final refreshToken = await _storage.read(key: TokenKeys.refreshToken);
            if (refreshToken != null) {
              final refreshDio = Dio(BaseOptions(baseUrl: apiUrl));
              final response = await refreshDio.post(
                '/auth/refresh-token',
                data: {'refreshToken': refreshToken},
              );
              final newAccessToken = response.data['data']['accessToken'] as String;
              await _storage.write(key: TokenKeys.accessToken, value: newAccessToken);

              final retryOptions = error.requestOptions;
              retryOptions.extra['retried'] = true;
              retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';
              final retryResponse = await dio.fetch(retryOptions);
              return handler.resolve(retryResponse);
            }
          } catch (_) {
            await _storage.delete(key: TokenKeys.accessToken);
            await _storage.delete(key: TokenKeys.refreshToken);
            await _storage.delete(key: TokenKeys.user);
            onAuthFailure?.call();
          }
        }

        handler.next(error);
      },
    ),
  );

  return dio;
}
