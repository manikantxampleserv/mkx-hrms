import '../../../core/constants/api_endpoints.dart';
import '../../../core/network/dio_client.dart';
import '../models/payslip_model.dart';

/// Data repository communicating with payroll endpoints
class PayrollRepository {
  final DioClient _client = DioClient.instance;

  Future<({Payslip? latest, String ytdEarnings, List<Payslip> slips})> getMyPayroll({
    int? employeeId,
    String? employeeCode,
  }) async {
    final queryParams = <String, dynamic>{};
    if (employeeId != null) queryParams['employee_id'] = employeeId;
    if (employeeCode != null) queryParams['employee_code'] = employeeCode;

    final response = await _client.get(
      ApiEndpoints.myPayroll,
      queryParameters: queryParams,
    );

    if (response is Map<String, dynamic>) {
      Payslip? latest;
      if (response['latest'] != null && response['latest'] is Map<String, dynamic>) {
        latest = Payslip.fromJson(response['latest'] as Map<String, dynamic>);
      }

      final ytd = response['ytd_earnings']?.toString() ?? '\$0';

      final slipsList = (response['slips'] as List<dynamic>? ?? [])
          .map((item) => Payslip.fromJson(item as Map<String, dynamic>))
          .toList();

      return (latest: latest, ytdEarnings: ytd, slips: slipsList);
    }

    throw Exception('Failed to load salary slips payload');
  }
}
