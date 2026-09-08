import '../../../core/constants/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/leave_model.dart';

/// Data repository for leaves history and applications
class LeavesRepository {
  final DioClient _client = DioClient.instance;

  Future<({LeaveBalances balances, List<LeaveRecord> history})> getMyLeaves({
    int? employeeId,
    String? employeeCode,
  }) async {
    final queryParams = <String, dynamic>{};
    if (employeeId != null) queryParams['employee_id'] = employeeId;
    if (employeeCode != null) queryParams['employee_code'] = employeeCode;

    final response = await _client.get(
      ApiEndpoints.myLeaves,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic>) {
      final balancesData = response['balances'] as Map<String, dynamic>? ?? {};
      final balances = LeaveBalances.fromJson(balancesData);

      final historyList = (response['history'] as List<dynamic>? ?? [])
          .map((item) => LeaveRecord.fromJson(item as Map<String, dynamic>))
          .toList();

      return (balances: balances, history: historyList);
    }

    throw Exception('Failed to load leaves payload');
  }

  Future<LeaveRecord> applyLeave({
    int? employeeId,
    required String leaveType,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    final response = await _client.post(
      ApiEndpoints.applyLeave,
      data: {
        'employee_id': ?employeeId,
        'leave_type': leaveType,
        'start_date': startDate,
        'end_date': endDate,
        'reason': reason,
      },
    );

    if (response is Map<String, dynamic>) {
      return LeaveRecord.fromJson(response);
    }
    throw Exception('Failed to submit leave application');
  }
}
