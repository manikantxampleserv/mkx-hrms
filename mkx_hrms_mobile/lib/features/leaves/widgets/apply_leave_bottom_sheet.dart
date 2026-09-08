import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/ui_helpers.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../../auth/state/auth_provider.dart';
import '../state/leaves_provider.dart';

/// Modal bottom sheet for applying for leaves
class ApplyLeaveBottomSheet extends StatefulWidget {
  const ApplyLeaveBottomSheet({super.key});

  @override
  State<ApplyLeaveBottomSheet> createState() => _ApplyLeaveBottomSheetState();
}

class _ApplyLeaveBottomSheetState extends State<ApplyLeaveBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  String _selectedLeaveType = 'Annual PTO';
  DateTime _startDate = DateTime.now().add(const Duration(days: 1));
  DateTime _endDate = DateTime.now().add(const Duration(days: 2));
  final _reasonController = TextEditingController();

  final List<String> _leaveTypes = [
    'Annual PTO',
    'Sick Leave',
    'Casual Leave',
    'Parental Leave',
  ];

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

    final dateFormat = DateFormat('yyyy-MM-dd');
    final success = await leaves.submitLeave(
      employeeId: auth.currentUser?.employeeDbId,
      leaveType: _selectedLeaveType,
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
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
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

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Apply for Leave',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.3,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.infoBgDark : AppColors.infoBgLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$_calculatedDays ${_calculatedDays == 1 ? "Day" : "Days"} Total',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.info,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Submit your time-off request for manager authorization.',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                ),
              ),
              const SizedBox(height: 20),

              // Leave Type Selector
              Text(
                'Leave Type',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppColors.darkForeground : AppColors.lightForeground,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkInput : AppColors.lightBackground,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  ),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedLeaveType,
                    isExpanded: true,
                    dropdownColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                    items: _leaveTypes.map((type) {
                      return DropdownMenuItem<String>(
                        value: type,
                        child: Text(
                          type,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: isDark ? AppColors.darkForeground : AppColors.lightForeground,
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
                            color: isDark ? AppColors.darkForeground : AppColors.lightForeground,
                          ),
                        ),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: () => _pickDate(isStart: true),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkInput : AppColors.lightBackground,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.calendar_today_outlined,
                                  size: 16,
                                  color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
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
                            color: isDark ? AppColors.darkForeground : AppColors.lightForeground,
                          ),
                        ),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: () => _pickDate(isStart: false),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkInput : AppColors.lightBackground,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.calendar_today_outlined,
                                  size: 16,
                                  color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
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
    );
  }
}
