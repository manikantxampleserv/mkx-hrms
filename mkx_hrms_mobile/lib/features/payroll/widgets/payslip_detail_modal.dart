import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/status_badge.dart';
import '../models/payslip_model.dart';

/// Detailed itemized salary slip modal bottom sheet
class PayslipDetailModal extends StatelessWidget {
  final Payslip slip;

  const PayslipDetailModal({super.key, required this.slip});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Payslip Summary',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                      ),
                    ),
                    Text(
                      slip.monthLabel,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                      ),
                    ),
                  ],
                ),
                StatusBadge(status: slip.status),
              ],
            ),
            const SizedBox(height: 20),

            // Net Pay Card Highlight
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSecondary : AppColors.lightSecondary,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Net Disbursed Amount',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    slip.formattedNetPay,
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      color: AppColors.success,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Credited on ${slip.payDate}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Employee Details
            _buildSectionHeader('Employee Details'),
            const SizedBox(height: 8),
            _buildRow('Employee Name', slip.employeeName, isDark),
            _buildRow('Designation', slip.role, isDark),
            _buildRow('Department', slip.department, isDark),
            _buildRow('Payroll Code', slip.payrollCode, isDark),
            const SizedBox(height: 16),

            /// Attendance & Leave Calculation
            _buildSectionHeader('Attendance & Calendar'),
            const SizedBox(height: 8),
            _buildRow('Working Days in Month', '${slip.workingDays} days', isDark),
            _buildRow('Paid Days', '${slip.paidDays} days', isDark),
            if (slip.lopDays > 0)
              _buildRow('Loss of Pay (Unpaid Leave)', '${slip.lopDays} days', isDark),
            const SizedBox(height: 16),

            /// Earnings Breakdown
            _buildSectionHeader('Earnings & Allowances'),
            const SizedBox(height: 8),
            if (slip.items.any((i) => i.category == 'Earning'))
              ...slip.items
                  .where((i) => i.category == 'Earning')
                  .map((it) => _buildRow(it.name, '+\$${it.amount.toStringAsFixed(2)}', isDark))
            else ...[
              _buildRow('Base Salary', slip.formattedBase, isDark),
              _buildRow('Allowances & Benefits', slip.formattedAllowance, isDark),
            ],
            const SizedBox(height: 16),

            /// Deductions Breakdown
            if (slip.items.any((i) => i.category == 'Deduction') || slip.totalDeductions > 0) ...[
              _buildSectionHeader('Deductions & Statutory Taxes'),
              const SizedBox(height: 8),
              if (slip.items.any((i) => i.category == 'Deduction'))
                ...slip.items
                    .where((i) => i.category == 'Deduction')
                    .map((it) => _buildRow(it.name, '-\$${it.amount.toStringAsFixed(2)}', isDark))
              else
                _buildRow('Total Deductions', slip.formattedDeductions, isDark),
              const SizedBox(height: 16),
            ],
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total Net Pay',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  slip.formattedNetPay,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
      ),
    );
  }

  Widget _buildRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
