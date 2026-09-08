import 'package:flutter/material.dart';
import '../../../core/storage/token_storage.dart';
import '../data/auth_repository.dart';
import '../models/user_model.dart';

/// State provider for Authentication and Global App Settings
class AuthProvider extends ChangeNotifier {
  final AuthRepository _repo = AuthRepository();

  UserModel? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;
  ThemeMode _themeMode = ThemeMode.system;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _currentUser != null;
  ThemeMode get themeMode => _themeMode;

  AuthProvider() {
    _initApp();
  }

  Future<void> _initApp() async {
    _isLoading = true;
    notifyListeners();

    // Load theme preference
    final savedMode = await TokenStorage.instance.getThemeMode();
    if (savedMode == 'dark') {
      _themeMode = ThemeMode.dark;
    } else if (savedMode == 'light') {
      _themeMode = ThemeMode.light;
    } else {
      _themeMode = ThemeMode.system;
    }

    // Check existing authentication token
    final isAuth = await _repo.isAuthenticated();
    if (isAuth) {
      _currentUser = await _repo.getCachedUser();
      notifyListeners();
      // Silently refresh profile in background
      _currentUser = await _repo.getMe() ?? _currentUser;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentUser = await _repo.login(email, password);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    _currentUser = null;
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _themeMode = mode;
    notifyListeners();
    String modeStr = 'system';
    if (mode == ThemeMode.dark) modeStr = 'dark';
    if (mode == ThemeMode.light) modeStr = 'light';
    await TokenStorage.instance.saveThemeMode(modeStr);
  }
}
