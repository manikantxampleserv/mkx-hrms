import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/ui_helpers.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/status_badge.dart';
import '../../auth/state/auth_provider.dart';
import '../../leaves/state/leaves_provider.dart';
import '../../leaves/widgets/apply_leave_bottom_sheet.dart';
import '../state/attendance_provider.dart';
import '../widgets/punch_card.dart';

/// Employee Attendance & Punch Dashboard Screen
class AttendanceDashboardScreen extends StatefulWidget {
  const AttendanceDashboardScreen({super.key});

  @override
  State<AttendanceDashboardScreen> createState() =>
      _AttendanceDashboardScreenState();
}

class _AttendanceDashboardScreenState extends State<AttendanceDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthProvider>();
    final attendance = context.read<AttendanceProvider>();
    final leaves = context.read<LeavesProvider>();
    await Future.wait([
      attendance.loadAttendance(
        employeeId: auth.currentUser?.employeeDbId,
        employeeCode: auth.currentUser?.employeeId,
      ),
      leaves.loadLeaves(
        employeeId: auth.currentUser?.employeeDbId,
        employeeCode: auth.currentUser?.employeeId,
      ),
    ]);
  }

  Future<void> _handlePunchIn() async {
    final auth = context.read<AuthProvider>();
    final attendance = context.read<AttendanceProvider>();
    final ok = await attendance.punchIn(
      employeeId: auth.currentUser?.employeeDbId,
      location: 'Office',
    );

    if (!mounted) return;
    if (ok) {
      UiHelpers.showSnackBar(
        context,
        'Successfully punched in at ${attendance.todayRecord?.checkIn}',
        isSuccess: true,
      );
    } else {
      UiHelpers.showSnackBar(
        context,
        attendance.errorMessage ?? 'Failed to punch in',
        isError: true,
      );
    }
  }

  Future<void> _handlePunchOut() async {
    final confirmed = await UiHelpers.showConfirmDialog(
      context: context,
      title: 'Confirm Punch Out',
      message: 'Are you sure you want to end your work shift for today?',
      confirmText: 'Punch Out',
      isDestructive: true,
    );

    if (confirmed != true || !mounted) return;

    final auth = context.read<AuthProvider>();
    final attendance = context.read<AttendanceProvider>();
    final ok = await attendance.punchOut(
      employeeId: auth.currentUser?.employeeDbId,
      location: 'Office',
    );

    if (!mounted) return;
    if (ok) {
      UiHelpers.showSnackBar(
        context,
        'Shift completed! Punched out at ${attendance.todayRecord?.checkOut}',
        isSuccess: true,
      );
    } else {
      UiHelpers.showSnackBar(
        context,
        attendance.errorMessage ?? 'Failed to punch out',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = context.watch<AuthProvider>();
    final attendance = context.watch<AttendanceProvider>();
    final leaves = context.watch<LeavesProvider>();
    final user = auth.currentUser;

    final totalRemainingLeaves = leaves.balances?.list.isNotEmpty == true
        ? leaves.balances!.list.fold<int>(0, (sum, q) => sum + q.remaining)
        : (leaves.masterLeaveTypes.isNotEmpty
              ? leaves.masterLeaveTypes.fold<int>(
                  0,
                  (sum, t) => sum + t.daysPerYear,
                )
              : 0);
    final pendingLeaveRequests = leaves.balances?.pendingRequests ?? 0;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: isDark ? AppColors.darkPrimary : AppColors.lightPrimary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Employee Greeting Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hello, ${user?.firstName ?? user?.name ?? "Employee"} 👋',
                          style: GoogleFonts.inter(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.4,
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.lightForeground,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${user?.role ?? "Employee"} • ${user?.department ?? "Engineering"}',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: isDark
                                ? AppColors.darkMuted
                                : AppColors.lightMuted,
                          ),
                        ),
                      ],
                    ),
                    // Avatar / Initial Badge
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.darkSecondary
                            : AppColors.lightSecondary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          (user?.name.isNotEmpty == true)
                              ? user!.name[0].toUpperCase()
                              : 'E',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: isDark
                                ? AppColors.darkForeground
                                : AppColors.lightForeground,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Interactive Punch Card
                PunchCard(
                  currentTime: attendance.currentTime,
                  record: attendance.todayRecord,
                  isPunching: attendance.isPunching,
                  onPunchIn: _handlePunchIn,
                  onPunchOut: _handlePunchOut,
                ),
                const SizedBox(height: 20),

                // Monthly Quick Metrics
                Text(
                  'Monthly Attendance',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: MetricCard(
                        title: 'Present Days',
                        value: '${attendance.stats?.presentDays ?? 0}',
                        subtext: 'This month',
                        icon: Icons.check_circle_outline_rounded,
                        iconColor: AppColors.success,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: MetricCard(
                        title: 'Late Punches',
                        value: '${attendance.stats?.lateDays ?? 0}',
                        subtext: 'After 10:00 AM',
                        icon: Icons.access_time_rounded,
                        iconColor: AppColors.warning,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: MetricCard(
                        title: 'Leave Balance',
                        value: '$totalRemainingLeaves',
                        subtext: 'Available days',
                        icon: Icons.beach_access_rounded,
                        iconColor: AppColors.info,
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => const ApplyLeaveBottomSheet(),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: MetricCard(
                        title: 'Pending Leaves',
                        value: '$pendingLeaveRequests',
                        subtext: pendingLeaveRequests == 1
                            ? '1 awaiting review'
                            : '$pendingLeaveRequests awaiting review',
                        icon: Icons.hourglass_top_rounded,
                        iconColor: const Color(0xffa855f7),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Recent Attendance History List
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Activity',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                    ),
                    Text(
                      'Last 30 Days',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.darkMuted
                            : AppColors.lightMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                if (attendance.isLoading && attendance.history.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                else if (attendance.history.isEmpty)
                  const EmptyState(
                    icon: Icons.event_busy_outlined,
                    title: 'No attendance records yet',
                    description:
                        'Your punch logs and daily records will appear here as you punch in and out.',
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: attendance.history.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = attendance.history[index];
                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.darkCard
                              : AppColors.lightCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder,
                          ),
                        ),
                        child: Row(
                          children: [
                            // Date Column
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.darkSecondary
                                    : AppColors.lightSecondary,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    AppDateUtils.formatDate(
                                      item.date,
                                    ).split(' ')[0],
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: isDark
                                          ? AppColors.darkMuted
                                          : AppColors.lightMuted,
                                    ),
                                  ),
                                  Text(
                                    item.date.split('-').last,
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                      color: isDark
                                          ? AppColors.darkForeground
                                          : AppColors.lightForeground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 14),

                            // In/Out Times
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        '${item.checkIn} - ${item.checkOut}',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${item.workHours} • ${item.location}',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: isDark
                                          ? AppColors.darkMuted
                                          : AppColors.lightMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Status Tag
                            StatusBadge(status: item.status),
                          ],
                        ),
                      );
                    },
                  ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
