import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';

enum ButtonVariant { primary, secondary, outline, danger }

/// Professional, highly responsive custom button widget with loading animation
class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Widget? icon;
  final ButtonVariant variant;
  final double height;
  final double? width;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? padding;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.variant = ButtonVariant.primary,
    this.height = 48,
    this.width,
    this.borderRadius,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final radius = borderRadius ?? BorderRadius.circular(10);

    Color bgColor;
    Color fgColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case ButtonVariant.primary:
        bgColor = isDark ? AppColors.darkPrimary : AppColors.lightPrimary;
        fgColor = isDark
            ? AppColors.darkPrimaryForeground
            : AppColors.lightPrimaryForeground;
        break;
      case ButtonVariant.secondary:
        bgColor = isDark ? AppColors.darkSecondary : AppColors.lightSecondary;
        fgColor = isDark
            ? AppColors.darkSecondaryForeground
            : AppColors.lightSecondaryForeground;
        break;
      case ButtonVariant.outline:
        bgColor = Colors.transparent;
        fgColor = isDark ? AppColors.darkForeground : AppColors.lightForeground;
        borderSide = BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        );
        break;
      case ButtonVariant.danger:
        bgColor = AppColors.error;
        fgColor = Colors.white;
        break;
    }

    final defaultPadding = padding ??
        EdgeInsets.symmetric(
          horizontal: (width != null && width! <= 100) ? 8 : 16,
        );

    return SizedBox(
      height: height,
      width: width,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: bgColor,
          foregroundColor: fgColor,
          elevation: 0,
          side: borderSide,
          shape: RoundedRectangleBorder(borderRadius: radius),
          padding: defaultPadding,
        ),
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(fgColor),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    icon!,
                    const SizedBox(width: 5),
                  ],
                  Flexible(
                    child: Text(
                      text,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.1,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
