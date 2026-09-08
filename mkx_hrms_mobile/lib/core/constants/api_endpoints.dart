import 'dart:io';
import 'package:flutter/foundation.dart';

/// Centralized API URLs and endpoint definitions for MKX HRMS Backend
class ApiEndpoints {
  ApiEndpoints._();

  /// Resolves the default backend base URL based on platform environment
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api/v1';
    }
    if (Platform.isAndroid) {
      // 10.0.2.2 points to host localhost in Android Emulator
      return 'http://10.0.2.2:3000/api/v1';
    }
    // Windows Desktop, iOS Simulator, macOS
    return 'http://localhost:3000/api/v1';
  }

  // Auth endpoints
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // Attendance endpoints
  static const String punch = '/attendance/punch';
  static const String myAttendance = '/attendance/my';

  // Leaves endpoints
  static const String myLeaves = '/leaves/my';
  static const String applyLeave = '/leaves';

  // Payroll endpoints
  static const String myPayroll = '/payroll/my';

  // Employees endpoints
  static const String employees = '/employees';
}
