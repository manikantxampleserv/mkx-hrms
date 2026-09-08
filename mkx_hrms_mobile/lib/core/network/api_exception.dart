import 'package:dio/dio.dart';

/// Standardized API exception carrying message, code, and response payload
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException({
    required this.message,
    this.statusCode,
    this.data,
  });

  factory ApiException.fromDioError(DioException error) {
    String errorMessage = 'An unexpected network error occurred';
    int? code = error.response?.statusCode;

    if (error.response?.data is Map<String, dynamic>) {
      final map = error.response!.data as Map<String, dynamic>;
      if (map.containsKey('message') && map['message'] != null) {
        errorMessage = map['message'].toString();
      } else if (map.containsKey('error') && map['error'] != null) {
        errorMessage = map['error'].toString();
      }
    } else {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          errorMessage = 'Connection timeout with HRMS server';
          break;
        case DioExceptionType.connectionError:
          errorMessage = 'Unable to connect to HRMS server. Check your network or server URL.';
          break;
        case DioExceptionType.cancel:
          errorMessage = 'Request was cancelled';
          break;
        default:
          errorMessage = error.message ?? 'Unknown network error';
      }
    }

    return ApiException(
      message: errorMessage,
      statusCode: code,
      data: error.response?.data,
    );
  }

  @override
  String toString() => message;
}
