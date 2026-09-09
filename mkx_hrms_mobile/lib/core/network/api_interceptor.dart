import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../storage/token_storage.dart';

/// Network interceptor injecting Authorization headers and structured logging
class ApiInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await TokenStorage.instance.getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    options.headers['Accept'] = 'application/json';
    options.headers['Content-Type'] = 'application/json';
    options.headers['x-timezone'] = 'Asia/Kolkata';
    options.headers['x-timezone-offset'] = '+05:30';

    if (kDebugMode) {
      debugPrint('➡️ [DIO REQ] ${options.method} ${options.uri}');
      if (options.data != null) {
        debugPrint('   Body: ${options.data}');
      }
    }
    return handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint(
        '✅ [DIO RES ${response.statusCode}] ${response.requestOptions.path}',
      );
    }
    return handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      debugPrint(
        '❌ [DIO ERR ${err.response?.statusCode}] ${err.requestOptions.path}: ${err.message}',
      );
    }
    return handler.next(err);
  }
}
