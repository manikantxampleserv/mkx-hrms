import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/status_badge.dart';
import '../models/attendance_model.dart';

/// Interactive Punch In / Punch Out card with live digital clock
class PunchCard extends StatelessWidget {
  final DateTime currentTime;
  final AttendanceRecord? record;
  final bool isPunching;
  final VoidCallback onPunchIn;
  final VoidCallback onPunchOut;

  const PunchCard({
    super.key,
    required this.currentTime,
    required this.record,
    required this.isPunching,
    required this.onPunchIn,
    required this.onPunchOut,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hasCheckedIn = record?.hasCheckedIn ?? false;
    final hasCheckedOut = record?.hasCheckedOut ?? false;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Header Date & Status Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppDateUtils.formatFullDate(currentTime),
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                ),
              ),
              StatusBadge(status: record?.status ?? 'Absent'),
            ],
          ),
          const SizedBox(height: 16),

          // Digital Live Clock
          Text(
            AppDateUtils.formatTime(currentTime),
            style: GoogleFonts.inter(
              fontSize: 34,
              fontWeight: FontWeight.w800,
              letterSpacing: -1,
              color: isDark ? AppColors.darkForeground : AppColors.lightForeground,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.location_on_outlined,
                size: 14,
                color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
              ),
              const SizedBox(width: 4),
              Text(
                'MKX Tech Headquarters • ${record?.location ?? "Office"}',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Check In & Check Out Time Badges
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSecondary : AppColors.lightSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildTimeColumn(
                  context,
                  title: 'Punch In',
                  time: record?.checkIn ?? '--:--',
                  icon: Icons.login_rounded,
                  iconColor: AppColors.success,
                ),
                Container(
                  width: 1,
                  height: 32,
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
                _buildTimeColumn(
                  context,
                  title: 'Punch Out',
                  time: record?.checkOut ?? '--:--',
                  icon: Icons.logout_rounded,
                  iconColor: AppColors.warning,
                ),
                Container(
                  width: 1,
                  height: 32,
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
                _buildTimeColumn(
                  context,
                  title: 'Total Hours',
                  time: record?.workHours ?? '0h 00m',
                  icon: Icons.timer_outlined,
                  iconColor: AppColors.info,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Action Button
          if (!hasCheckedIn)
            CustomButton(
              text: 'Punch In Now',
              icon: const Icon(Icons.fingerprint_rounded, size: 20),
              isLoading: isPunching,
              onPressed: onPunchIn,
            )
          else if (hasCheckedIn && !hasCheckedOut)
            CustomButton(
              text: 'Punch Out Now',
              icon: const Icon(Icons.timer_off_outlined, size: 20),
              variant: ButtonVariant.danger,
              isLoading: isPunching,
              onPressed: onPunchOut,
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              width: double.infinity,
              decoration: BoxDecoration(
                color: isDark ? AppColors.successBgDark : AppColors.successBgLight,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: AppColors.success.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Punched for Today (${record?.workHours ?? "Completed"})',
                    style: GoogleFonts.inter(
                      color: AppColors.success,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTimeColumn(
    BuildContext context, {
    required String title,
    required String time,
    required IconData icon,
    required Color iconColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: iconColor),
            const SizedBox(width: 4),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          time,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: isDark ? AppColors.darkForeground : AppColors.lightForeground,
          ),
        ),
      ],
    );
  }
}
