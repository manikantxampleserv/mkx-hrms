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
    final offset = DateTime.now().timeZoneOffset;
    final sign = offset.isNegative ? '-' : '+';
    final tzOffset =
        '$sign${offset.inHours.abs().toString().padLeft(2, '0')}:${(offset.inMinutes.abs() % 60).toString().padLeft(2, '0')}';
    options.headers['x-timezone'] = DateTime.now().timeZoneName.isNotEmpty
        ? DateTime.now().timeZoneName
        : 'Asia/Kolkata';
    options.headers['x-timezone-offset'] = tzOffset;

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
