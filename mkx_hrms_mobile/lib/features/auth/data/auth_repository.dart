import '../../../core/constants/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/token_storage.dart';
import '../models/user_model.dart';

/// Data repository managing authentication requests and token persistence
class AuthRepository {
  final DioClient _client = DioClient.instance;
  final TokenStorage _storage = TokenStorage.instance;

  Future<UserModel> login(String email, String password) async {
    final response = await _client.post(
      ApiEndpoints.login,
      data: {
        'email': email.trim(),
        'password': password.trim(),
      },
    );

    if (response is Map<String, dynamic>) {
      final token = response['token']?.toString();
      final userData = response['user'] as Map<String, dynamic>?;

      if (token != null && token.isNotEmpty) {
        await _storage.saveToken(token);
      }

      if (userData != null) {
        final user = UserModel.fromJson(userData);
        await _storage.saveUserRaw(user.toRawJson());
        return user;
      }
    }

    throw Exception('Failed to parse login response');
  }

  Future<UserModel?> getMe() async {
    try {
      final response = await _client.get(ApiEndpoints.me);
      if (response is Map<String, dynamic>) {
        final user = UserModel.fromJson(response);
        await _storage.saveUserRaw(user.toRawJson());
        return user;
      }
    } catch (_) {
      // Fallback to cached profile if offline
      return getCachedUser();
    }
    return null;
  }

  Future<UserModel?> getCachedUser() async {
    final raw = await _storage.getUserRaw();
    if (raw != null && raw.isNotEmpty) {
      try {
        return UserModel.fromRawJson(raw);
      } catch (_) {}
    }
    return null;
  }

  Future<void> logout() async {
    try {
      await _client.post(ApiEndpoints.logout);
    } catch (_) {}
    await _storage.clearToken();
  }

  Future<bool> isAuthenticated() async {
    final token = await _storage.getToken();
    return token != null && token.isNotEmpty;
  }
}
