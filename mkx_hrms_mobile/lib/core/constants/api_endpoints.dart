/// Centralized API URLs and endpoint definitions for MKX HRMS Backend
class ApiEndpoints {
  ApiEndpoints._();

  /// Production Live Render backend base URL
  static const String liveBaseUrl = 'https://mkx-hrms-be.onrender.com/api/v1';

  /// Local development URL for Android emulator
  static const String emulatorBaseUrl = 'http://10.0.2.2:3000/api/v1';

  /// Localhost URL for iOS simulator / web / desktop
  static const String localBaseUrl = 'http://localhost:3000/api/v1';

  /// Resolves the default backend base URL
  /// Configured with live Render backend
  static String get defaultBaseUrl => liveBaseUrl;

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

  // Masters endpoints
  static const String leaveTypes = '/masters/leave-types';

  // Payroll endpoints
  static const String myPayroll = '/payroll/my';

  // Employees endpoints
  static const String employees = '/employees';
}
