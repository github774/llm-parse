// src/coerce.ts
import type { Schema } from './types.js';

/**
 * Attempts type coercion on data fields where schema type mismatches.
 * Never drops keys. Returns a shallow copy with coerced values where unambiguous.
 */
export function coerceData(
  schema: Schema,
  data: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...data };

  for (const [key, field] of Object.entries(schema)) {
    const value = result[key];
    if (typeof value !== 'string') continue; // only coerce from strings

    if (field.type === 'number') {
      const trimmed = value.trim();
      if (trimmed === '') continue; // "" and whitespace-only must not become 0
      const n = Number(trimmed);
      if (!Number.isNaN(n) && Number.isFinite(n)) result[key] = n; // exclude Infinity/-Infinity
    } else if (field.type === 'boolean') {
      if (value === 'true') result[key] = true;
      else if (value === 'false') result[key] = false;
    }
  }

  return result;
}
