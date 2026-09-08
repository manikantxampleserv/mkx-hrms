/// Represents a daily attendance punch record
class AttendanceRecord {
  final String id;
  final int? dbId;
  final String date;
  final String checkIn;
  final String checkOut;
  final String workHours;
  final String status;
  final String location;

  AttendanceRecord({
    required this.id,
    this.dbId,
    required this.date,
    required this.checkIn,
    required this.checkOut,
    required this.workHours,
    required this.status,
    required this.location,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id']?.toString() ?? json['record_id']?.toString() ?? '',
      dbId: json['db_id'] is int
          ? json['db_id']
          : int.tryParse(json['db_id']?.toString() ?? ''),
      date: json['date']?.toString() ?? '',
      checkIn: json['check_in']?.toString() ?? '--:--',
      checkOut: json['check_out']?.toString() ?? '--:--',
      workHours: json['work_hours']?.toString() ?? '0h 00m',
      status: json['status']?.toString() ?? 'Absent',
      location: json['location']?.toString() ?? 'Office',
    );
  }

  bool get hasCheckedIn => checkIn != '--:--' && checkIn.isNotEmpty;
  bool get hasCheckedOut => checkOut != '--:--' && checkOut.isNotEmpty;
}

/// Summary statistics for employee attendance
class AttendanceStats {
  final int presentDays;
  final int lateDays;
  final int absentDays;
  final int totalDays;

  AttendanceStats({
    required this.presentDays,
    required this.lateDays,
    required this.absentDays,
    required this.totalDays,
  });

  factory AttendanceStats.fromJson(Map<String, dynamic> json) {
    return AttendanceStats(
      presentDays: (json['present_days'] as num?)?.toInt() ?? 0,
      lateDays: (json['late_days'] as num?)?.toInt() ?? 0,
      absentDays: (json['absent_days'] as num?)?.toInt() ?? 0,
      totalDays: (json['total_days'] as num?)?.toInt() ?? 0,
    );
  }
}
