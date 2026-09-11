/// Single earning or deduction line item in payslip
class PayslipItem {
  final String name;
  final String code;
  final String category;
  final num amount;
  final bool isTaxable;

  PayslipItem({
    required this.name,
    required this.code,
    required this.category,
    required this.amount,
    required this.isTaxable,
  });

  factory PayslipItem.fromJson(Map<String, dynamic> json) {
    return PayslipItem(
      name: json['name']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Earning',
      amount: json['amount'] is num
          ? json['amount']
          : (num.tryParse(json['amount']?.toString() ?? '') ?? 0),
      isTaxable: json['is_taxable'] == true,
    );
  }
}

/// Model representing an employee's salary slip
class Payslip {
  final String id;
  final int? dbId;
  final String payrollCode;
  final num baseSalary;
  final num allowance;
  final num grossPay;
  final num totalDeductions;
  final num netPay;
  final String formattedBase;
  final String formattedAllowance;
  final String formattedGross;
  final String formattedDeductions;
  final String formattedNetPay;
  final int workingDays;
  final num paidDays;
  final num lopDays;
  final num lopAmount;
  final List<PayslipItem> items;
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
    required this.grossPay,
    required this.totalDeductions,
    required this.netPay,
    required this.formattedBase,
    required this.formattedAllowance,
    required this.formattedGross,
    required this.formattedDeductions,
    required this.formattedNetPay,
    required this.workingDays,
    required this.paidDays,
    required this.lopDays,
    required this.lopAmount,
    required this.items,
    required this.status,
    required this.payDate,
    required this.monthLabel,
    required this.employeeName,
    required this.role,
    required this.department,
  });

  factory Payslip.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    final List<PayslipItem> parsedItems = [];
    if (rawItems is List) {
      for (final it in rawItems) {
        if (it is Map<String, dynamic>) {
          parsedItems.add(PayslipItem.fromJson(it));
        }
      }
    }

    final gross = json['gross_pay'] is num
        ? json['gross_pay']
        : (num.tryParse(json['gross_pay']?.toString() ?? '') ??
            (json['base_salary'] is num ? json['base_salary'] : 0));

    final deductions = json['total_deductions'] is num
        ? json['total_deductions']
        : (num.tryParse(json['total_deductions']?.toString() ?? '') ?? 0);

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
      grossPay: gross,
      totalDeductions: deductions,
      netPay: json['net_pay'] is num
          ? json['net_pay']
          : (num.tryParse(json['net_pay']?.toString() ?? '') ?? 0),
      formattedBase: json['formatted_base']?.toString() ?? '\$0',
      formattedAllowance: json['formatted_allowance']?.toString() ?? '\$0',
      formattedGross: json['formatted_gross']?.toString() ?? '\$$gross',
      formattedDeductions: json['formatted_deductions']?.toString() ?? '\$$deductions',
      formattedNetPay: json['formatted_net_pay']?.toString() ?? '\$0',
      workingDays: json['working_days'] is int
          ? json['working_days']
          : (int.tryParse(json['working_days']?.toString() ?? '') ?? 30),
      paidDays: json['paid_days'] is num
          ? json['paid_days']
          : (num.tryParse(json['paid_days']?.toString() ?? '') ?? 30),
      lopDays: json['lop_days'] is num
          ? json['lop_days']
          : (num.tryParse(json['lop_days']?.toString() ?? '') ?? 0),
      lopAmount: json['lop_amount'] is num
          ? json['lop_amount']
          : (num.tryParse(json['lop_amount']?.toString() ?? '') ?? 0),
      items: parsedItems,
      status: json['status']?.toString() ?? 'Processed',
      payDate: json['pay_date']?.toString() ?? '',
      monthLabel: json['month_label']?.toString() ?? 'Disbursement',
      employeeName: json['employee_name']?.toString() ?? 'Employee',
      role: json['role']?.toString() ?? 'Staff',
      department: json['department']?.toString() ?? 'General',
    );
  }
}
