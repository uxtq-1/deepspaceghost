import 'dart:math';

/// Basic sanitization utilities for user-provided input.
///
/// Removes characters that could be used for HTML/JS injection and
/// enforces a maximum length to reduce the risk of buffer overflows or
/// resource exhaustion.
String sanitizeMessage(String input) {
  final withoutAngles = input.replaceAll(RegExp(r'[<>]'), '');
  final trimmed = withoutAngles.trim();
  const maxLength = 500;
  return trimmed.substring(0, min(trimmed.length, maxLength));
}
