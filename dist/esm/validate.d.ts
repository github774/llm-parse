import type { Schema, ValidationResult } from './types.js';
/**
 * Validates data against a schema. Never throws — always returns ValidationResult.
 */
export declare function validate(schema: Schema, data: Record<string, unknown>): ValidationResult;
//# sourceMappingURL=validate.d.ts.map