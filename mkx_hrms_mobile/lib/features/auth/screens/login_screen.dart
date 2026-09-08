import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/utils/ui_helpers.dart';
import '../../../core/widgets/custom_button.dart';
import '../../../core/widgets/custom_text_field.dart';
import '../state/auth_provider.dart';
import '../../navigation/screens/main_shell_screen.dart';

/// Employee Login Screen matching the MKX HRMS design system
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController(text: 'sarah.c@mkx.com');
  final _passwordController = TextEditingController(text: 'password123');
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final success = await auth.login(
      _emailController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      UiHelpers.showSnackBar(
        context,
        'Welcome back, ${auth.currentUser?.name ?? "Employee"}!',
        isSuccess: true,
      );
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainShellScreen()),
      );
    } else {
      UiHelpers.showSnackBar(
        context,
        auth.errorMessage ?? 'Login failed. Please verify your credentials.',
        isError: true,
      );
    }
  }

  void _showServerConfigModal() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final urlController = TextEditingController(
      text: DioClient.instance.dio.options.baseUrl,
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Backend Server Connection',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Customize the API endpoint URL for Android emulator (10.0.2.2:3000), physical device IP, or localhost.',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
              ),
            ),
            const SizedBox(height: 16),
            CustomTextField(
              controller: urlController,
              label: 'API Base URL',
              hintText: 'http://localhost:3000/v1',
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: CustomButton(
                    text: 'Reset Default',
                    variant: ButtonVariant.outline,
                    onPressed: () {
                      DioClient.instance.updateBaseUrl(ApiEndpoints.defaultBaseUrl);
                      Navigator.of(ctx).pop();
                      UiHelpers.showSnackBar(context, 'Reset to platform default');
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: CustomButton(
                    text: 'Save',
                    onPressed: () {
                      if (urlController.text.trim().isNotEmpty) {
                        DioClient.instance.updateBaseUrl(urlController.text.trim());
                        Navigator.of(ctx).pop();
                        UiHelpers.showSnackBar(context, 'Base URL updated', isSuccess: true);
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Logo & Header
                    Center(
                      child: Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSecondary : AppColors.lightSecondary,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                          ),
                        ),
                        child: Icon(
                          Icons.fingerprint_rounded,
                          size: 32,
                          color: isDark ? AppColors.darkPrimary : AppColors.lightPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'MKX HRMS',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                        color: isDark ? AppColors.darkForeground : AppColors.lightForeground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Employee Self-Service Portal',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Card Container
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkCard : AppColors.lightCard,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Sign In',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Enter your corporate email and password to access your attendance, leaves, and salary slips.',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Email Input
                          CustomTextField(
                            controller: _emailController,
                            label: 'Corporate Email',
                            hintText: 'name@mkx.dev',
                            keyboardType: TextInputType.emailAddress,
                            prefixIcon: Icon(
                              Icons.alternate_email_rounded,
                              size: 18,
                              color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                            ),
                            validator: (val) {
                              if (val == null || val.trim().isEmpty) {
                                return 'Email is required';
                              }
                              if (!val.contains('@')) {
                                return 'Enter a valid email address';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Password Input
                          CustomTextField(
                            controller: _passwordController,
                            label: 'Password',
                            hintText: '••••••••',
                            obscureText: _obscurePassword,
                            prefixIcon: Icon(
                              Icons.lock_outline_rounded,
                              size: 18,
                              color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                size: 18,
                                color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                            validator: (val) {
                              if (val == null || val.isEmpty) {
                                return 'Password is required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 22),

                          // Submit Button
                          CustomButton(
                            text: 'Sign In to Portal',
                            isLoading: auth.isLoading,
                            onPressed: _handleLogin,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Quick Demo Accounts & Server Settings
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        TextButton.icon(
                          onPressed: _showServerConfigModal,
                          icon: const Icon(Icons.settings_outlined, size: 15),
                          label: Text(
                            'Server Settings',
                            style: GoogleFonts.inter(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
