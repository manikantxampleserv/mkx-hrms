import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/ui_helpers.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../../auth/state/auth_provider.dart';
import '../models/leave_model.dart';
import '../state/leaves_provider.dart';

/// Modal bottom sheet for applying for leaves
class ApplyLeaveBottomSheet extends StatefulWidget {
  const ApplyLeaveBottomSheet({super.key});

  @override
  State<ApplyLeaveBottomSheet> createState() => _ApplyLeaveBottomSheetState();
}

class _ApplyLeaveBottomSheetState extends State<ApplyLeaveBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedLeaveType;
  DateTime _startDate = DateTime.now().add(const Duration(days: 1));
  DateTime _endDate = DateTime.now().add(const Duration(days: 2));
  final _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final leaves = context.read<LeavesProvider>();
      if (leaves.masterLeaveTypes.isEmpty) {
        leaves.loadLeaveTypes();
      }
      if (leaves.balances == null) {
        final auth = context.read<AuthProvider>();
        leaves.loadLeaves(
          employeeId: auth.currentUser?.employeeDbId,
          employeeCode: auth.currentUser?.employeeId,
        );
      }
    });
  }

  int get _calculatedDays {
    final diff = _endDate.difference(_startDate).inDays;
    return diff >= 0 ? diff + 1 : 1;
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initialDate = isStart ? _startDate : _endDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate)) {
            _endDate = _startDate;
          }
        } else {
          _endDate = picked;
          if (_startDate.isAfter(_endDate)) {
            _startDate = _endDate;
          }
        }
      });
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final leaves = context.read<LeavesProvider>();

    final selectedType = _selectedLeaveType ?? leaves.leaveTypeNames.first;
    final dateFormat = DateFormat('yyyy-MM-dd');
    final success = await leaves.submitLeave(
      employeeId: auth.currentUser?.employeeDbId,
      leaveType: selectedType,
      startDate: dateFormat.format(_startDate),
      endDate: dateFormat.format(_endDate),
      reason: _reasonController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(context).pop();
      UiHelpers.showSnackBar(
        context,
        'Leave request submitted for approval!',
        isSuccess: true,
      );
    } else {
      UiHelpers.showSnackBar(
        context,
        leaves.errorMessage ?? 'Failed to submit leave request',
        isError: true,
      );
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final leaves = context.watch<LeavesProvider>();
    final dateDisplay = DateFormat('MMM dd, yyyy');

    final availableNames = leaves.leaveTypeNames;
    if (_selectedLeaveType == null ||
        !availableNames.contains(_selectedLeaveType)) {
      if (availableNames.isNotEmpty) {
        _selectedLeaveType = availableNames.first;
      }
    }

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle Bar
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.darkBorder
                          : AppColors.lightBorder,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Sheet Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Apply for Leave',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.lightForeground,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? AppColors.infoBgDark
                                : AppColors.infoBgLight,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '$_calculatedDays ${_calculatedDays == 1 ? "Day" : "Days"}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.info,
                            ),
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.of(context).pop(),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      color: isDark
                          ? AppColors.darkMuted
                          : AppColors.lightMuted,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Submit your time-off request for manager authorization.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                  ),
                ),
                const SizedBox(height: 20),

                // Leave Type Selector
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Leave Type',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark
                            ? AppColors.darkForeground
                            : AppColors.lightForeground,
                      ),
                    ),
                    if (leaves.isLoadingLeaveTypes)
                      const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                  ],
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.darkInput
                        : AppColors.lightBackground,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isDark
                          ? AppColors.darkBorder
                          : AppColors.lightBorder,
                    ),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedLeaveType,
                      isExpanded: true,
                      dropdownColor: isDark
                          ? AppColors.darkCard
                          : AppColors.lightCard,
                      items: leaves.masterLeaveTypes.isNotEmpty
                          ? leaves.masterLeaveTypes.map((type) {
                              final color = UiHelpers.parseHexColor(type.color);
                              return DropdownMenuItem<String>(
                                value: type.name,
                                child: Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: color,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        type.name,
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                          color: isDark
                                              ? AppColors.darkForeground
                                              : AppColors.lightForeground,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: color.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '${type.daysPerYear} d/yr',
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: color,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList()
                          : availableNames.map((type) {
                              return DropdownMenuItem<String>(
                                value: type,
                                child: Text(
                                  type,
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: isDark
                                        ? AppColors.darkForeground
                                        : AppColors.lightForeground,
                                  ),
                                ),
                              );
                            }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() => _selectedLeaveType = val);
                        }
                      },
                    ),
                  ),
                ),
                _buildQuotaIndicator(leaves, isDark),
                const SizedBox(height: 16),

                // Date Selectors
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Start Date',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: isDark
                                  ? AppColors.darkForeground
                                  : AppColors.lightForeground,
                            ),
                          ),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: () => _pickDate(isStart: true),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.darkInput
                                    : AppColors.lightBackground,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isDark
                                      ? AppColors.darkBorder
                                      : AppColors.lightBorder,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.calendar_today_outlined,
                                    size: 16,
                                    color: isDark
                                        ? AppColors.darkMuted
                                        : AppColors.lightMuted,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    dateDisplay.format(_startDate),
                                    style: GoogleFonts.inter(fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'End Date',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: isDark
                                  ? AppColors.darkForeground
                                  : AppColors.lightForeground,
                            ),
                          ),
                          const SizedBox(height: 6),
                          InkWell(
                            onTap: () => _pickDate(isStart: false),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.darkInput
                                    : AppColors.lightBackground,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isDark
                                      ? AppColors.darkBorder
                                      : AppColors.lightBorder,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.calendar_today_outlined,
                                    size: 16,
                                    color: isDark
                                        ? AppColors.darkMuted
                                        : AppColors.lightMuted,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    dateDisplay.format(_endDate),
                                    style: GoogleFonts.inter(fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Reason Input
                CustomTextField(
                  controller: _reasonController,
                  label: 'Reason for Leave',
                  hintText: 'Briefly state the reason for this time-off...',
                  maxLines: 3,
                  validator: (val) {
                    if (val == null || val.trim().isEmpty) {
                      return 'Please provide a reason for the leave request';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // Submit Button
                CustomButton(
                  text: 'Submit Leave Request',
                  icon: const Icon(Icons.send_rounded, size: 18),
                  isLoading: leaves.isSubmitting,
                  onPressed: _handleSubmit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Builds live quota card indicating remaining leave balance and limit checks
  Widget _buildQuotaIndicator(LeavesProvider leaves, bool isDark) {
    final selectedName = _selectedLeaveType ?? '';
    final list = leaves.balances?.list ?? [];
    LeaveQuota? quota;
    for (final item in list) {
      if ((item.name ?? '').toLowerCase() == selectedName.toLowerCase() ||
          (item.code ?? '').toLowerCase() == selectedName.toLowerCase()) {
        quota = item;
        break;
      }
    }

    if (quota == null && leaves.masterLeaveTypes.isNotEmpty) {
      for (final type in leaves.masterLeaveTypes) {
        if (type.name.toLowerCase() == selectedName.toLowerCase() ||
            type.code.toLowerCase() == selectedName.toLowerCase()) {
          quota = LeaveQuota(
            id: type.id,
            name: type.name,
            code: type.code,
            total: type.daysPerYear,
            used: 0,
            remaining: type.daysPerYear,
            color: type.color,
            isPaid: type.isPaid,
          );
          break;
        }
      }
    }

    if (quota == null) return const SizedBox.shrink();

    final remaining = quota.remaining;
    final total = quota.total;
    final used = quota.used;
    final isExceeded = _calculatedDays > remaining;
    final isZero = remaining <= 0;
    final color = UiHelpers.parseHexColor(quota.color);

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isExceeded
            ? (isDark ? AppColors.errorBgDark : AppColors.errorBgLight)
            : (isDark ? AppColors.darkSecondary : AppColors.lightSecondary),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isExceeded
              ? AppColors.error.withValues(alpha: 0.4)
              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    isExceeded
                        ? Icons.warning_amber_rounded
                        : Icons.account_balance_wallet_outlined,
                    size: 15,
                    color: isExceeded ? AppColors.error : color,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Available Balance',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isExceeded
                          ? AppColors.error
                          : (isDark
                              ? AppColors.darkForeground
                              : AppColors.lightForeground),
                    ),
                  ),
                ],
              ),
              Text(
                '$remaining / $total Days Left',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: isExceeded ? AppColors.error : color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: total > 0 ? (used / total).clamp(0.0, 1.0) : 0.0,
              minHeight: 4,
              backgroundColor:
                  isDark ? AppColors.darkBorder : AppColors.lightBorder,
              valueColor: AlwaysStoppedAnimation<Color>(
                isExceeded ? AppColors.error : color,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '$used used • $total allocated',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                ),
              ),
              if (isExceeded)
                Text(
                  isZero
                      ? 'No balance left'
                      : 'Exceeds quota by ${_calculatedDays - remaining}d',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.error,
                  ),
                )
              else
                Text(
                  '$_calculatedDays ${_calculatedDays == 1 ? "day" : "days"} requested',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
