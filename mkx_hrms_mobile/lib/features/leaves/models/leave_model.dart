/// Single Leave Request record
class LeaveRecord {
  final String id;
  final int? dbId;
  final String leaveCode;
  final String leaveType;
  final String startDate;
  final String endDate;
  final int daysCount;
  final String reason;
  final String status;
  final String appliedOn;

  LeaveRecord({
    required this.id,
    this.dbId,
    required this.leaveCode,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.daysCount,
    required this.reason,
    required this.status,
    required this.appliedOn,
  });

  factory LeaveRecord.fromJson(Map<String, dynamic> json) {
    return LeaveRecord(
      id: json['id']?.toString() ?? json['leave_code']?.toString() ?? '',
      dbId: json['db_id'] is int
          ? json['db_id']
          : int.tryParse(json['db_id']?.toString() ?? ''),
      leaveCode: json['leave_code']?.toString() ?? json['id']?.toString() ?? '',
      leaveType: json['leave_type']?.toString() ?? 'Annual PTO',
      startDate: json['start_date']?.toString() ?? '',
      endDate: json['end_date']?.toString() ?? '',
      daysCount: (json['days_count'] as num?)?.toInt() ?? 1,
      reason: json['reason']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Pending',
      appliedOn: json['applied_on']?.toString() ?? '',
    );
  }
}

/// Balance allowance bucket for a leave type
class LeaveQuota {
  final int total;
  final int used;
  final int remaining;

  LeaveQuota({
    required this.total,
    required this.used,
    required this.remaining,
  });

  factory LeaveQuota.fromJson(Map<String, dynamic> json) {
    return LeaveQuota(
      total: (json['total'] as num?)?.toInt() ?? 0,
      used: (json['used'] as num?)?.toInt() ?? 0,
      remaining: (json['remaining'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Overall leave balance summary
class LeaveBalances {
  final LeaveQuota annual;
  final LeaveQuota sick;
  final LeaveQuota casual;
  final int pendingRequests;

  LeaveBalances({
    required this.annual,
    required this.sick,
    required this.casual,
    required this.pendingRequests,
  });

  factory LeaveBalances.fromJson(Map<String, dynamic> json) {
    return LeaveBalances(
      annual: LeaveQuota.fromJson(json['annual'] as Map<String, dynamic>? ?? {}),
      sick: LeaveQuota.fromJson(json['sick'] as Map<String, dynamic>? ?? {}),
      casual: LeaveQuota.fromJson(json['casual'] as Map<String, dynamic>? ?? {}),
      pendingRequests: (json['pending_requests'] as num?)?.toInt() ?? 0,
    );
  }
}
