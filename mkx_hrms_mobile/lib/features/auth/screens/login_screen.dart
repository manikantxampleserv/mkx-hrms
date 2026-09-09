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
      // MainShellScreen is automatically rendered by Consumer<AuthProvider> in main.dart
      // If a route was pushed on top of LoginScreen, clear it back to root
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
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
    final currentUrl = DioClient.instance.dio.options.baseUrl;
    final urlController = TextEditingController(text: currentUrl);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final isLive = urlController.text == ApiEndpoints.liveBaseUrl;
          final isEmulator = urlController.text == ApiEndpoints.emulatorBaseUrl;
          final isLocal = urlController.text == ApiEndpoints.localBaseUrl;

          return Padding(
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Server Environment',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isLive ? 'Live Cloud' : 'Local Dev',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Select an active backend environment or enter a custom endpoint URL below:',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: isDark ? AppColors.darkMuted : AppColors.lightMuted,
                  ),
                ),
                const SizedBox(height: 16),

                // Quick preset environment chips
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.cloud_done_rounded, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            'Render Live',
                            style: GoogleFonts.inter(fontSize: 12),
                          ),
                        ],
                      ),
                      selected: isLive,
                      selectedColor: isDark
                          ? AppColors.darkPrimary.withValues(alpha: 0.2)
                          : AppColors.lightPrimary.withValues(alpha: 0.1),
                      onSelected: (selected) {
                        if (selected) {
                          setModalState(() {
                            urlController.text = ApiEndpoints.liveBaseUrl;
                          });
                        }
                      },
                    ),
                    ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.phone_android_rounded, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            'Android 10.0.2.2',
                            style: GoogleFonts.inter(fontSize: 12),
                          ),
                        ],
                      ),
                      selected: isEmulator,
                      selectedColor: isDark
                          ? AppColors.darkPrimary.withValues(alpha: 0.2)
                          : AppColors.lightPrimary.withValues(alpha: 0.1),
                      onSelected: (selected) {
                        if (selected) {
                          setModalState(() {
                            urlController.text = ApiEndpoints.emulatorBaseUrl;
                          });
                        }
                      },
                    ),
                    ChoiceChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.laptop_chromebook_rounded, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            'Localhost',
                            style: GoogleFonts.inter(fontSize: 12),
                          ),
                        ],
                      ),
                      selected: isLocal,
                      selectedColor: isDark
                          ? AppColors.darkPrimary.withValues(alpha: 0.2)
                          : AppColors.lightPrimary.withValues(alpha: 0.1),
                      onSelected: (selected) {
                        if (selected) {
                          setModalState(() {
                            urlController.text = ApiEndpoints.localBaseUrl;
                          });
                        }
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 16),
                CustomTextField(
                  controller: urlController,
                  label: 'API Base URL',
                  hintText: 'https://...',
                  onChanged: (_) => setModalState(() {}),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: CustomButton(
                        text: 'Reset to Live',
                        variant: ButtonVariant.outline,
                        onPressed: () {
                          DioClient.instance.updateBaseUrl(
                            ApiEndpoints.liveBaseUrl,
                          );
                          setState(() {});
                          Navigator.of(ctx).pop();
                          UiHelpers.showSnackBar(
                            context,
                            'Reset to Render Live Backend',
                            isSuccess: true,
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomButton(
                        text: 'Apply URL',
                        onPressed: () {
                          final trimmed = urlController.text.trim();
                          if (trimmed.isNotEmpty) {
                            DioClient.instance.updateBaseUrl(trimmed);
                            setState(() {});
                            Navigator.of(ctx).pop();
                            UiHelpers.showSnackBar(
                              context,
                              'API endpoint switched to $trimmed',
                              isSuccess: true,
                            );
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
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
                          color: isDark
                              ? AppColors.darkSecondary
                              : AppColors.lightSecondary,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder,
                          ),
                        ),
                        child: Icon(
                          Icons.fingerprint_rounded,
                          size: 32,
                          color: isDark
                              ? AppColors.darkPrimary
                              : AppColors.lightPrimary,
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
                        color: isDark
                            ? AppColors.darkForeground
                            : AppColors.lightForeground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Employee Self-Service Portal',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: isDark
                            ? AppColors.darkMuted
                            : AppColors.lightMuted,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Card Container
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.darkCard
                            : AppColors.lightCard,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
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
                              color: isDark
                                  ? AppColors.darkMuted
                                  : AppColors.lightMuted,
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
                              color: isDark
                                  ? AppColors.darkMuted
                                  : AppColors.lightMuted,
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
                              color: isDark
                                  ? AppColors.darkMuted
                                  : AppColors.lightMuted,
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                size: 18,
                                color: isDark
                                    ? AppColors.darkMuted
                                    : AppColors.lightMuted,
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
                    Center(
                      child: InkWell(
                        onTap: _showServerConfigModal,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
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
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.success,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                DioClient.instance.dio.options.baseUrl.contains(
                                      'render.com',
                                    )
                                    ? 'Server: Render Live'
                                    : 'Server: Local Dev',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isDark
                                      ? AppColors.darkForeground
                                      : AppColors.lightForeground,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.tune_rounded,
                                size: 14,
                                color: isDark
                                    ? AppColors.darkMuted
                                    : AppColors.lightMuted,
                              ),
                            ],
                          ),
                        ),
                      ),
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
