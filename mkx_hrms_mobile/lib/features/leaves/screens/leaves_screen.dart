import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/status_badge.dart';
import '../../auth/state/auth_provider.dart';
import '../state/leaves_provider.dart';
import '../widgets/apply_leave_bottom_sheet.dart';

/// Leaves overview, balance cards, and application history screen
class LeavesScreen extends StatefulWidget {
  const LeavesScreen({super.key});

  @override
  State<LeavesScreen> createState() => _LeavesScreenState();
}

class _LeavesScreenState extends State<LeavesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final auth = context.read<AuthProvider>();
    final leaves = context.read<LeavesProvider>();
    await leaves.loadLeaves(
      employeeId: auth.currentUser?.employeeDbId,
      employeeCode: auth.currentUser?.employeeId,
    );
  }

  void _openApplyModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ApplyLeaveBottomSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final leaves = context.watch<LeavesProvider>();
    final balances = leaves.balances;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: isDark ? AppColors.darkPrimary : AppColors.lightPrimary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with Apply Leave CTA
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Leaves',
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
                          'Track balances and submit time off',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: isDark
                                ? AppColors.darkMuted
                                : AppColors.lightMuted,
                          ),
                        ),
                      ],
                    ),
                    CustomButton(
                      text: 'Apply',
                      icon: const Icon(Icons.add_rounded, size: 16),
                      height: 38,
                      width: 98,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      onPressed: _openApplyModal,
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Quota Allowance Cards
                Row(
                  children: [
                    Expanded(
                      child: _buildQuotaCard(
                        context,
                        title: 'Annual PTO',
                        remaining: balances?.annual.remaining ?? 18,
                        total: balances?.annual.total ?? 18,
                        color: AppColors.info,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildQuotaCard(
                        context,
                        title: 'Sick Leave',
                        remaining: balances?.sick.remaining ?? 12,
                        total: balances?.sick.total ?? 12,
                        color: AppColors.success,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _buildQuotaCard(
                        context,
                        title: 'Casual',
                        remaining: balances?.casual.remaining ?? 6,
                        total: balances?.casual.total ?? 6,
                        color: AppColors.warning,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Status Filter Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['All', 'Pending', 'Approved', 'Rejected'].map((
                      filter,
                    ) {
                      final isSelected = leaves.selectedFilter == filter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(
                            filter,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: isSelected
                                  ? (isDark
                                        ? AppColors.darkPrimaryForeground
                                        : AppColors.lightPrimaryForeground)
                                  : (isDark
                                        ? AppColors.darkMuted
                                        : AppColors.lightMuted),
                            ),
                          ),
                          selected: isSelected,
                          onSelected: (_) => leaves.setFilter(filter),
                          backgroundColor: isDark
                              ? AppColors.darkSecondary
                              : AppColors.lightSecondary,
                          selectedColor: isDark
                              ? AppColors.darkPrimary
                              : AppColors.lightPrimary,
                          showCheckmark: false,
                          side: BorderSide(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 2,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),

                // History List
                if (leaves.isLoading && leaves.history.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                else if (leaves.filteredHistory.isEmpty)
                  EmptyState(
                    icon: Icons.event_available_outlined,
                    title: 'No leave applications found',
                    description:
                        'Tap the "+ Apply" button above to submit your first leave application.',
                    action: CustomButton(
                      text: 'Apply for Leave',
                      width: 160,
                      height: 40,
                      onPressed: _openApplyModal,
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: leaves.filteredHistory.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = leaves.filteredHistory[index];
                      return Container(
                        padding: const EdgeInsets.all(16),
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
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: item.status == 'Approved'
                                            ? AppColors.success
                                            : (item.status == 'Pending'
                                                  ? AppColors.warning
                                                  : AppColors.error),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      item.leaveType,
                                      style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                                StatusBadge(status: item.status),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // Date Range & Duration
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? AppColors.darkSecondary
                                    : AppColors.lightSecondary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.date_range_rounded,
                                        size: 14,
                                        color: isDark
                                            ? AppColors.darkMuted
                                            : AppColors.lightMuted,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        '${AppDateUtils.formatDate(item.startDate)} - ${AppDateUtils.formatDate(item.endDate)}',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    '${item.daysCount} ${item.daysCount == 1 ? "day" : "days"}',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isDark
                                          ? AppColors.darkForeground
                                          : AppColors.lightForeground,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),

                            // Reason
                            Text(
                              item.reason,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: isDark
                                    ? AppColors.darkMuted
                                    : AppColors.lightMuted,
                              ),
                            ),
                            const SizedBox(height: 8),

                            // Applied Date & Code
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  item.leaveCode,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? AppColors.darkMuted
                                        : AppColors.lightMuted,
                                  ),
                                ),
                                Text(
                                  'Applied: ${AppDateUtils.formatDate(item.appliedOn)}',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: isDark
                                        ? AppColors.darkMuted
                                        : AppColors.lightMuted,
                                  ),
                                ),
                              ],
                            ),
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

  Widget _buildQuotaCard(
    BuildContext context, {
    required String title,
    required int remaining,
    required int total,
    required Color color,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '$remaining',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              const SizedBox(width: 2),
              Text(
                '/$total',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            'Remaining',
            style: GoogleFonts.inter(
              fontSize: 10,
              color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
            ),
          ),
        ],
      ),
    );
  }
}
