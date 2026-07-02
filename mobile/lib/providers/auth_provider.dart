import 'package:flutter/material.dart';
import '../api/auth_api.dart' as auth_api;
import '../api/client.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  AppUser? _user;
  bool _loading = true;

  AppUser? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    onAuthFailure = _forceLogout;
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    _user = await auth_api.getStoredAuth();
    _loading = false;
    notifyListeners();
  }

  Future<auth_api.LoginResult> login(String email, String password) async {
    final result = await auth_api.login(email, password);
    if (result.success) {
      _user = result.user;
      notifyListeners();
    }
    return result;
  }

  Future<void> logout() async {
    await auth_api.logout();
    _forceLogout();
  }

  void _forceLogout() {
    _user = null;
    notifyListeners();
  }
}
