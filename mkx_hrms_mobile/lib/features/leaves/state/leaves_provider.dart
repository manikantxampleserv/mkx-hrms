import 'package:flutter/material.dart';
import '../data/leaves_repository.dart';
import '../models/leave_model.dart';

/// State management for leave requests, quotas, and filtering
class LeavesProvider extends ChangeNotifier {
  final LeavesRepository _repo = LeavesRepository();

  LeaveBalances? _balances;
  List<LeaveRecord> _history = [];
  List<MasterLeaveType> _masterLeaveTypes = [];
  bool _isLoading = false;
  bool _isLoadingLeaveTypes = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  String _selectedFilter = 'All';

  LeaveBalances? get balances => _balances;
  List<LeaveRecord> get history => _history;
  List<MasterLeaveType> get masterLeaveTypes => _masterLeaveTypes;
  bool get isLoading => _isLoading;
  bool get isLoadingLeaveTypes => _isLoadingLeaveTypes;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  String get selectedFilter => _selectedFilter;

  List<String> get leaveTypeNames {
    if (_masterLeaveTypes.isNotEmpty) {
      return _masterLeaveTypes.map((e) => e.name).toList();
    }
    if (_balances?.list.isNotEmpty == true) {
      return _balances!.list
          .map((e) => e.name ?? '')
          .where((n) => n.isNotEmpty)
          .toList();
    }
    return const [];
  }

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

  /// Loads personal leaves history, quotas, and active master leave types
  Future<void> loadLeaves({int? employeeId, String? employeeCode}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final leavesFuture = _repo.getMyLeaves(
        employeeId: employeeId,
        employeeCode: employeeCode,
      );
      final typesFuture =
          _repo.getLeaveTypes().catchError((_) => <MasterLeaveType>[]);

      final res = await leavesFuture;
      final types = await typesFuture;

      _balances = res.balances;
      _history = res.history;
      if (types.isNotEmpty) {
        _masterLeaveTypes = types;
      }
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetches active master leave types independently
  Future<void> loadLeaveTypes() async {
    if (_isLoadingLeaveTypes) return;
    _isLoadingLeaveTypes = true;
    notifyListeners();

    try {
      final types = await _repo.getLeaveTypes();
      if (types.isNotEmpty) {
        _masterLeaveTypes = types;
      }
    } catch (_) {
      // Keep existing list on failure
    } finally {
      _isLoadingLeaveTypes = false;
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
