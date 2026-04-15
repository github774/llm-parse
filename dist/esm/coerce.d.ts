import type { Schema } from './types.js';
/**
 * Attempts type coercion on data fields where schema type mismatches.
 * Never drops keys. Returns a shallow copy with coerced values where unambiguous.
 */
export declare function coerceData(schema: Schema, data: Record<string, unknown>): Record<string, unknown>;
//# sourceMappingURL=coerce.d.ts.map