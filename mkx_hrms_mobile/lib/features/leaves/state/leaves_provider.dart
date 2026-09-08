import 'package:flutter/material.dart';
import '../data/leaves_repository.dart';
import '../models/leave_model.dart';

/// State management for leave requests, quotas, and filtering
class LeavesProvider extends ChangeNotifier {
  final LeavesRepository _repo = LeavesRepository();

  LeaveBalances? _balances;
  List<LeaveRecord> _history = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  String _selectedFilter = 'All';

  LeaveBalances? get balances => _balances;
  List<LeaveRecord> get history => _history;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  String get selectedFilter => _selectedFilter;

  List<LeaveRecord> get filteredHistory {
    if (_selectedFilter == 'All') return _history;
    return _history
        .where((item) =>
            item.status.toLowerCase() == _selectedFilter.toLowerCase())
        .toList();
  }

  void setFilter(String filter) {
    _selectedFilter = filter;
    notifyListeners();
  }

  Future<void> loadLeaves({int? employeeId, String? employeeCode}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repo.getMyLeaves(
        employeeId: employeeId,
        employeeCode: employeeCode,
      );
      _balances = res.balances;
      _history = res.history;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitLeave({
    int? employeeId,
    required String leaveType,
    required String startDate,
    required String endDate,
    required String reason,
  }) async {
    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newRecord = await _repo.applyLeave(
        employeeId: employeeId,
        leaveType: leaveType,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
      );
      _history.insert(0, newRecord);
      _isSubmitting = false;
      notifyListeners();
      // Reload in background for updated balances
      await loadLeaves(employeeId: employeeId);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isSubmitting = false;
      notifyListeners();
      return false;
    }
  }
}
