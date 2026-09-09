import 'package:intl/intl.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/attendance_model.dart';

/// Data repository communicating with attendance endpoints
class AttendanceRepository {
  final DioClient _client = DioClient.instance;

  Future<
    ({
      AttendanceRecord? today,
      AttendanceStats stats,
      List<AttendanceRecord> history,
    })
  >
  getMyAttendance({int? employeeId, String? employeeCode}) async {
    final queryParams = <String, dynamic>{};
    if (employeeId != null) queryParams['employee_id'] = employeeId;
    if (employeeCode != null) queryParams['employee_code'] = employeeCode;
    final now = DateTime.now();
    queryParams['date'] = DateFormat('yyyy-MM-dd').format(now);
    queryParams['timezone'] = now.timeZoneName.isNotEmpty
        ? now.timeZoneName
        : 'Asia/Kolkata';

    final response = await _client.get(
      ApiEndpoints.myAttendance,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic>) {
      AttendanceRecord? today;
      if (response['today'] != null &&
          response['today'] is Map<String, dynamic>) {
        today = AttendanceRecord.fromJson(
          response['today'] as Map<String, dynamic>,
        );
      }

      final statsData = response['stats'] as Map<String, dynamic>? ?? {};
      final stats = AttendanceStats.fromJson(statsData);

      final historyList = (response['history'] as List<dynamic>? ?? [])
          .map(
            (item) => AttendanceRecord.fromJson(item as Map<String, dynamic>),
          )
          .toList();

      return (today: today, stats: stats, history: historyList);
    }

    throw Exception('Failed to parse attendance payload');
  }

  Future<AttendanceRecord> punch({
    required String action,
    int? employeeId,
    String location = 'Office',
  }) async {
    final now = DateTime.now();
    final formattedTime = DateFormat('hh:mm a').format(now);
    final dateString = DateFormat('yyyy-MM-dd').format(now);
    final offset = now.timeZoneOffset;
    final sign = offset.isNegative ? '-' : '+';
    final tzOffset =
        '$sign${offset.inHours.abs().toString().padLeft(2, '0')}:${(offset.inMinutes.abs() % 60).toString().padLeft(2, '0')}';

    final response = await _client.post(
      ApiEndpoints.punch,
      data: {
        'action': action,
        'employee_id': employeeId,
        'location': location,
        'time': formattedTime,
        'date': dateString,
        'timezone': now.timeZoneName.isNotEmpty
            ? now.timeZoneName
            : 'Asia/Kolkata',
        'tz_offset': tzOffset,
      },
    );

    if (response is Map<String, dynamic>) {
      return AttendanceRecord.fromJson(response);
    }
    throw Exception('Failed to record attendance punch');
  }
}
