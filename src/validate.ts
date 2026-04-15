// src/validate.ts
import type { Schema, ValidationResult, SchemaType } from './types.ts';

function getActualType(value: unknown): SchemaType {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'object';
  return typeof value as SchemaType;
}

function matches(expected: SchemaType, value: unknown): boolean {
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return typeof value === 'object' && !Array.isArray(value) && value !== null;
  return typeof value === expected;
}

/**
 * Validates data against a schema. Never throws — always returns ValidationResult.
 */
export function validate(schema: Schema, data: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  try {
    for (const [key, field] of Object.entries(schema)) {
      const value = data?.[key];
      const missing = value === undefined || value === null;

      if (missing) {
        if (field.required) errors.push(`"${key}" is required`);
        continue;
      }

      if (!matches(field.type, value)) {
        errors.push(`"${key}" must be ${field.type}, got ${getActualType(value)}`);
      }
    }
  } catch {
    // never throw
  }

  return { valid: errors.length === 0, errors };
}
