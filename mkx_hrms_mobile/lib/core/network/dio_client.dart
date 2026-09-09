import 'package:dio/dio.dart';
import '../constants/api_endpoints.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';
import 'api_interceptor.dart';

/// Dio networking service managing the HTTP client instance and request dispatching
class DioClient {
  DioClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.defaultBaseUrl,
        connectTimeout: const Duration(seconds: 180),
        receiveTimeout: const Duration(seconds: 180),
        sendTimeout: const Duration(seconds: 180),
      ),
    );

    _dio.interceptors.add(ApiInterceptor());
    _initCustomBaseUrl();
  }

  static final DioClient instance = DioClient._();
  late final Dio _dio;

  Dio get dio => _dio;

  Future<void> _initCustomBaseUrl() async {
    final customUrl = await TokenStorage.instance.getBaseUrl();
    if (customUrl != null && customUrl.isNotEmpty) {
      _dio.options.baseUrl = customUrl;
    }
  }

  void updateBaseUrl(String newUrl) {
    _dio.options.baseUrl = newUrl;
    TokenStorage.instance.saveBaseUrl(newUrl);
  }

  /// Perform a GET request
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return _extractData(response);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Perform a POST request
  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return _extractData(response);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Perform a PATCH request
  Future<dynamic> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return _extractData(response);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  dynamic _extractData(Response response) {
    if (response.data is Map<String, dynamic>) {
      final map = response.data as Map<String, dynamic>;
      if (map.containsKey('data')) {
        return map['data'];
      }
      return map;
    }
    return response.data;
  }
}
