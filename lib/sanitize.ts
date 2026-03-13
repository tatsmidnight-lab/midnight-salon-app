/**
 * Input sanitization utilities for API routes.
 */

/** Strip HTML tags to prevent XSS in stored text */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/** Sanitize a string field: trim, strip HTML, limit length */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return ''
  return stripHtml(input.trim()).slice(0, maxLength)
}

/** Validate UUID format */
export function isValidUuid(input: unknown): input is string {
  if (typeof input !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)
}

/** Validate positive number */
export function isPositiveNumber(input: unknown): input is number {
  return typeof input === 'number' && isFinite(input) && input > 0
}
