import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'features/attendance/state/attendance_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/state/auth_provider.dart';
import 'features/leaves/state/leaves_provider.dart';
import 'features/navigation/screens/main_shell_screen.dart';
import 'features/payroll/state/payroll_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MkxHrmsApp());
}

/// Root Application Widget for MKX HRMS Mobile
class MkxHrmsApp extends StatelessWidget {
  const MkxHrmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AttendanceProvider()),
        ChangeNotifierProvider(create: (_) => LeavesProvider()),
        ChangeNotifierProvider(create: (_) => PayrollProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'MKX HRMS',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: auth.themeMode,
            home: _buildHome(auth),
          );
        },
      ),
    );
  }

  Widget _buildHome(AuthProvider auth) {
    if (auth.isLoading) {
      return const _SplashScreen();
    }
    if (auth.isAuthenticated) {
      return const MainShellScreen();
    }
    return const LoginScreen();
  }
}

/// Branded initial splash screen while authentication status initializes
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSecondary : AppColors.lightSecondary,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Icon(
                Icons.fingerprint_rounded,
                size: 36,
                color: isDark ? AppColors.darkPrimary : AppColors.lightPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'MKX HRMS',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: isDark ? AppColors.darkPrimary : AppColors.lightPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
