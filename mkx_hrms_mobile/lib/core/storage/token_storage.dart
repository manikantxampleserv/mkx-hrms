import 'package:shared_preferences/shared_preferences.dart';

/// Secure and persistent local key-value store for session and settings
class TokenStorage {
  TokenStorage._();
  static final TokenStorage instance = TokenStorage._();

  static const String _keyToken = 'auth_token';
  static const String _keyUser = 'cached_user';
  static const String _keyThemeMode = 'theme_mode';
  static const String _keyCustomBaseUrl = 'custom_base_url';

  SharedPreferences? _prefs;

  Future<SharedPreferences> get _asyncPrefs async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  Future<void> saveToken(String token) async {
    final p = await _asyncPrefs;
    await p.setString(_keyToken, token);
  }

  Future<String?> getToken() async {
    final p = await _asyncPrefs;
    return p.getString(_keyToken);
  }

  Future<void> clearToken() async {
    final p = await _asyncPrefs;
    await p.remove(_keyToken);
    await p.remove(_keyUser);
  }

  Future<void> saveUserRaw(String userJson) async {
    final p = await _asyncPrefs;
    await p.setString(_keyUser, userJson);
  }

  Future<String?> getUserRaw() async {
    final p = await _asyncPrefs;
    return p.getString(_keyUser);
  }

  Future<void> saveThemeMode(String mode) async {
    final p = await _asyncPrefs;
    await p.setString(_keyThemeMode, mode);
  }

  Future<String> getThemeMode() async {
    final p = await _asyncPrefs;
    return p.getString(_keyThemeMode) ?? 'system';
  }

  Future<void> saveBaseUrl(String url) async {
    final p = await _asyncPrefs;
    await p.setString(_keyCustomBaseUrl, url);
  }

  Future<String?> getBaseUrl() async {
    final p = await _asyncPrefs;
    return p.getString(_keyCustomBaseUrl);
  }
}
