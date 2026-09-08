import 'package:flutter/material.dart';
import '../data/payroll_repository.dart';
import '../models/payslip_model.dart';

/// State management for salary slips and compensation data
class PayrollProvider extends ChangeNotifier {
  final PayrollRepository _repo = PayrollRepository();

  Payslip? _latestPayslip;
  String _ytdEarnings = '\$0';
  List<Payslip> _slips = [];
  bool _isLoading = false;
  String? _errorMessage;

  Payslip? get latestPayslip => _latestPayslip;
  String get ytdEarnings => _ytdEarnings;
  List<Payslip> get slips => _slips;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadPayroll({int? employeeId, String? employeeCode}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repo.getMyPayroll(
        employeeId: employeeId,
        employeeCode: employeeCode,
      );
      _latestPayslip = res.latest;
      _ytdEarnings = res.ytdEarnings;
      _slips = res.slips;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }
}
