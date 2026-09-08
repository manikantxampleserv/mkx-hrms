import 'package:intl/intl.dart';

/// Currency and numeric formatters for payroll and slips
class CurrencyUtils {
  CurrencyUtils._();

  static String format(num? amount, {String symbol = '\$'}) {
    if (amount == null) return '$symbol 0.00';
    final formatter = NumberFormat.currency(symbol: symbol, decimalDigits: 2);
    return formatter.format(amount);
  }
}
