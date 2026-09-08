import 'dart:convert';

/// Authenticated user / employee profile representation
class UserModel {
  final int id;
  final String employeeId;
  final int? employeeDbId;
  final String name;
  final String? firstName;
  final String? lastName;
  final String email;
  final String role;
  final String department;
  final String status;
  final String? avatar;
  final String? joinDate;
  final String? managerName;
  final String? timezone;

  UserModel({
    required this.id,
    required this.employeeId,
    this.employeeDbId,
    required this.name,
    this.firstName,
    this.lastName,
    required this.email,
    required this.role,
    required this.department,
    required this.status,
    this.avatar,
    this.joinDate,
    this.managerName,
    this.timezone,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      employeeId: json['employee_id']?.toString() ?? '',
      employeeDbId: json['employee_db_id'] is int
          ? json['employee_db_id']
          : int.tryParse(json['employee_db_id']?.toString() ?? ''),
      name: json['name']?.toString() ??
          '${json['first_name'] ?? ''} ${json['last_name'] ?? ''}'.trim(),
      firstName: json['first_name']?.toString(),
      lastName: json['last_name']?.toString(),
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'Employee',
      department: json['department']?.toString() ?? 'General',
      status: json['status']?.toString() ?? 'Active',
      avatar: json['avatar']?.toString(),
      joinDate: json['join_date']?.toString(),
      managerName: json['manager_name']?.toString(),
      timezone: json['timezone']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'employee_db_id': employeeDbId,
      'name': name,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'role': role,
      'department': department,
      'status': status,
      'avatar': avatar,
      'join_date': joinDate,
      'manager_name': managerName,
      'timezone': timezone,
    };
  }

  String toRawJson() => jsonEncode(toJson());

  factory UserModel.fromRawJson(String str) =>
      UserModel.fromJson(jsonDecode(str) as Map<String, dynamic>);
}
