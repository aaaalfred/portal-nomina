/**
 * Extract RFC from filename using common patterns
 * Examples:
 *  - XAXX010101000_2024-01-15.pdf
 *  - XAXX010101000.pdf
 *  - nomina_XAXX010101000_quincenal.pdf
 */
export function extractRfcFromFilename(filename: string): string | null {
  // RFC pattern: 3-4 letters + 6 digits + 3 alphanumeric
  const rfcPattern = /[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}/g;
  
  const matches = filename.match(rfcPattern);
  
  if (matches && matches.length > 0) {
    return matches[0];
  }

  return null;
}
