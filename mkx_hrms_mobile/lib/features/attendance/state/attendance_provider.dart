import 'dart:async';
import 'package:flutter/material.dart';
import '../data/attendance_repository.dart';
import '../models/attendance_model.dart';

/// State management for daily attendance, live ticker, and punch operations
class AttendanceProvider extends ChangeNotifier {
  final AttendanceRepository _repo = AttendanceRepository();

  AttendanceRecord? _todayRecord;
  AttendanceStats? _stats;
  List<AttendanceRecord> _history = [];
  bool _isLoading = false;
  bool _isPunching = false;
  String? _errorMessage;

  late Timer _tickerTimer;
  DateTime _currentTime = DateTime.now();

  AttendanceRecord? get todayRecord => _todayRecord;
  AttendanceStats? get stats => _stats;
  List<AttendanceRecord> get history => _history;
  bool get isLoading => _isLoading;
  bool get isPunching => _isPunching;
  String? get errorMessage => _errorMessage;
  DateTime get currentTime => _currentTime;

  AttendanceProvider() {
    _startClockTicker();
  }

  void _startClockTicker() {
    _tickerTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      _currentTime = DateTime.now();
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _tickerTimer.cancel();
    super.dispose();
  }

  Future<void> loadAttendance({int? employeeId, String? employeeCode}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _repo.getMyAttendance(
        employeeId: employeeId,
        employeeCode: employeeCode,
      );
      _todayRecord = res.today;
      _stats = res.stats;
      _history = res.history;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> punchIn({int? employeeId, String location = 'Office'}) async {
    _isPunching = true;
    notifyListeners();

    try {
      final updated = await _repo.punch(
        action: 'check-in',
        employeeId: employeeId,
        location: location,
      );
      _todayRecord = updated;
      // Refresh history & stats in background
      await loadAttendance(employeeId: employeeId);
      _isPunching = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isPunching = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> punchOut({int? employeeId, String location = 'Office'}) async {
    _isPunching = true;
    notifyListeners();

    try {
      final updated = await _repo.punch(
        action: 'check-out',
        employeeId: employeeId,
        location: location,
      );
      _todayRecord = updated;
      // Refresh history & stats in background
      await loadAttendance(employeeId: employeeId);
      _isPunching = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isPunching = false;
      notifyListeners();
      return false;
    }
  }
}
