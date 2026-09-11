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
      leaveType: json['leave_type']?.toString() ?? 'Leave',
      startDate: json['start_date']?.toString() ?? '',
      endDate: json['end_date']?.toString() ?? '',
      daysCount: (json['days_count'] as num?)?.toInt() ?? 1,
      reason: json['reason']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Pending',
      appliedOn: json['applied_on']?.toString() ?? '',
    );
  }
}

/// Master Leave Type model fetched from Masters API
class MasterLeaveType {
  final int id;
  final String name;
  final String code;
  final int daysPerYear;
  final bool isPaid;
  final String? color;
  final String? description;
  final String status;

  MasterLeaveType({
    required this.id,
    required this.name,
    required this.code,
    required this.daysPerYear,
    required this.isPaid,
    this.color,
    this.description,
    required this.status,
  });

  factory MasterLeaveType.fromJson(Map<String, dynamic> json) {
    return MasterLeaveType(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: json['name']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      daysPerYear: (json['days_per_year'] as num?)?.toInt() ?? 12,
      isPaid: json['is_paid'] == true || json['is_paid']?.toString() == 'true',
      color: json['color']?.toString(),
      description: json['description']?.toString(),
      status: json['status']?.toString() ?? 'Active',
    );
  }
}

/// Balance allowance bucket for a leave type
class LeaveQuota {
  final int? id;
  final String? name;
  final String? code;
  final int total;
  final int used;
  final int remaining;
  final String? color;
  final bool? isPaid;

  LeaveQuota({
    this.id,
    this.name,
    this.code,
    required this.total,
    required this.used,
    required this.remaining,
    this.color,
    this.isPaid,
  });

  factory LeaveQuota.fromJson(Map<String, dynamic> json) {
    return LeaveQuota(
      id: (json['id'] as num?)?.toInt(),
      name: json['name']?.toString(),
      code: json['code']?.toString(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      used: (json['used'] as num?)?.toInt() ?? 0,
      remaining: (json['remaining'] as num?)?.toInt() ?? 0,
      color: json['color']?.toString(),
      isPaid: json['is_paid'] is bool ? json['is_paid'] as bool : null,
    );
  }
}

/// Overall leave balance summary
class LeaveBalances {
  final LeaveQuota annual;
  final LeaveQuota sick;
  final LeaveQuota casual;
  final int pendingRequests;
  final List<LeaveQuota> list;

  LeaveBalances({
    required this.annual,
    required this.sick,
    required this.casual,
    required this.pendingRequests,
    this.list = const [],
  });

  factory LeaveBalances.fromJson(Map<String, dynamic> json) {
    final annualQuota =
        LeaveQuota.fromJson(json['annual'] as Map<String, dynamic>? ?? {});
    final sickQuota =
        LeaveQuota.fromJson(json['sick'] as Map<String, dynamic>? ?? {});
    final casualQuota =
        LeaveQuota.fromJson(json['casual'] as Map<String, dynamic>? ?? {});

    final rawList = json['list'] as List<dynamic>?;
    final parsedList = rawList != null
        ? rawList
            .map((e) => LeaveQuota.fromJson(e as Map<String, dynamic>))
            .toList()
        : <LeaveQuota>[];

    return LeaveBalances(
      annual: annualQuota,
      sick: sickQuota,
      casual: casualQuota,
      pendingRequests: (json['pending_requests'] as num?)?.toInt() ?? 0,
      list: parsedList,
    );
  }
}
