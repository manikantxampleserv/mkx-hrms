/// Model representing an employee's salary slip
class Payslip {
  final String id;
  final int? dbId;
  final String payrollCode;
  final num baseSalary;
  final num allowance;
  final num netPay;
  final String formattedBase;
  final String formattedAllowance;
  final String formattedNetPay;
  final String status;
  final String payDate;
  final String monthLabel;
  final String employeeName;
  final String role;
  final String department;

  Payslip({
    required this.id,
    this.dbId,
    required this.payrollCode,
    required this.baseSalary,
    required this.allowance,
    required this.netPay,
    required this.formattedBase,
    required this.formattedAllowance,
    required this.formattedNetPay,
    required this.status,
    required this.payDate,
    required this.monthLabel,
    required this.employeeName,
    required this.role,
    required this.department,
  });

  factory Payslip.fromJson(Map<String, dynamic> json) {
    return Payslip(
      id: json['id']?.toString() ?? json['payroll_code']?.toString() ?? '',
      dbId: json['db_id'] is int
          ? json['db_id']
          : int.tryParse(json['db_id']?.toString() ?? ''),
      payrollCode: json['payroll_code']?.toString() ?? json['id']?.toString() ?? '',
      baseSalary: json['base_salary'] is num
          ? json['base_salary']
          : (num.tryParse(json['base_salary']?.toString() ?? '') ?? 0),
      allowance: json['allowance'] is num
          ? json['allowance']
          : (num.tryParse(json['allowance']?.toString() ?? '') ?? 0),
      netPay: json['net_pay'] is num
          ? json['net_pay']
          : (num.tryParse(json['net_pay']?.toString() ?? '') ?? 0),
      formattedBase: json['formatted_base']?.toString() ?? '\$0',
      formattedAllowance: json['formatted_allowance']?.toString() ?? '\$0',
      formattedNetPay: json['formatted_net_pay']?.toString() ?? '\$0',
      status: json['status']?.toString() ?? 'Processed',
      payDate: json['pay_date']?.toString() ?? '',
      monthLabel: json['month_label']?.toString() ?? 'Disbursement',
      employeeName: json['employee_name']?.toString() ?? 'Employee',
      role: json['role']?.toString() ?? 'Engineer',
      department: json['department']?.toString() ?? 'Engineering',
    );
  }
}
