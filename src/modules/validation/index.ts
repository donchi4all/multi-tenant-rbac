export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required and must be a non-empty string.`);
  }
}

export function assertArrayHasItems<T>(value: T[], field: string): void {
  if (!Array.isArray(value) || value.length < 1) {
    throw new ValidationError(`${field} must contain at least one item.`);
  }
}

export function normalizeToArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
