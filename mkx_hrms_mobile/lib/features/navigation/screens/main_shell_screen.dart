import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/app_colors.dart';
import '../../attendance/screens/attendance_dashboard_screen.dart';
import '../../leaves/screens/leaves_screen.dart';
import '../../payroll/screens/payroll_screen.dart';
import '../../profile/screens/profile_screen.dart';

/// Gmail-style Bottom Navigation Shell housing the 4 primary employee modules.
/// Uses Material 3's NavigationBar with a pill-shaped selection indicator,
/// no top border/divider, and a soft elevation shadow — matching Gmail's
/// bottom nav look and feel.
class MainShellScreen extends StatefulWidget {
  const MainShellScreen({super.key});

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    AttendanceDashboardScreen(),
    LeavesScreen(),
    PayrollScreen(),
    ProfileScreen(),
  ];

  static const List<_NavItemData> _items = [
    _NavItemData(
      label: 'Punch In',
      icon: Icons.fingerprint_rounded,
      activeIcon: Icons.fingerprint_rounded,
    ),
    _NavItemData(
      label: 'Leaves',
      icon: Icons.event_note_outlined,
      activeIcon: Icons.event_note_rounded,
    ),
    _NavItemData(
      label: 'Payslips',
      icon: Icons.receipt_long_outlined,
      activeIcon: Icons.receipt_long_rounded,
    ),
    _NavItemData(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final surfaceColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final activeColor = isDark ? AppColors.darkPrimary : AppColors.lightPrimary;
    final inactiveColor = isDark ? AppColors.darkMuted : AppColors.lightMuted;
    final indicatorColor =
        (isDark ? AppColors.darkPrimary : AppColors.lightPrimary).withValues(
          alpha: isDark ? 0.24 : 0.14,
        );

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Theme(
            data: Theme.of(context).copyWith(
              navigationBarTheme: NavigationBarThemeData(
                height: 68,
                backgroundColor: surfaceColor,
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                indicatorColor: indicatorColor,
                indicatorShape: const StadiumBorder(),
                labelTextStyle: WidgetStateProperty.resolveWith((states) {
                  final selected = states.contains(WidgetState.selected);
                  return GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? activeColor : inactiveColor,
                  );
                }),
                iconTheme: WidgetStateProperty.resolveWith((states) {
                  final selected = states.contains(WidgetState.selected);
                  return IconThemeData(
                    size: 24,
                    color: selected ? activeColor : inactiveColor,
                  );
                }),
              ),
            ),
            child: NavigationBar(
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) =>
                  setState(() => _currentIndex = index),
              animationDuration: const Duration(milliseconds: 350),
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              destinations: _items
                  .map(
                    (item) => NavigationDestination(
                      icon: Icon(item.icon),
                      selectedIcon: Icon(item.activeIcon),
                      label: item.label,
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItemData {
  final String label;
  final IconData icon;
  final IconData activeIcon;

  const _NavItemData({
    required this.label,
    required this.icon,
    required this.activeIcon,
  });
}
