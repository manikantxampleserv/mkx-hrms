import 'package:intl/intl.dart';

/// Formatting and manipulation helpers for dates and timestamps
class AppDateUtils {
  AppDateUtils._();

  static String formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '--';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM dd, yyyy').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  static String formatFullDate(DateTime date) {
    return DateFormat('EEEE, MMMM dd, yyyy').format(date);
  }

  static String formatTime(DateTime date) {
    return DateFormat('hh:mm:ss a').format(date);
  }

  static String formatShortDate(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  static String formatMonthYear(DateTime date) {
    return DateFormat('MMMM yyyy').format(date);
  }
}
