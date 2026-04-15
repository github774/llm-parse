"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function getActualType(value) {
    if (Array.isArray(value))
        return 'array';
    if (value === null)
        return 'object';
    return typeof value;
}
function matches(expected, value) {
    if (expected === 'array')
        return Array.isArray(value);
    if (expected === 'object')
        return typeof value === 'object' && !Array.isArray(value) && value !== null;
    return typeof value === expected;
}
/**
 * Validates data against a schema. Never throws — always returns ValidationResult.
 */
function validate(schema, data) {
    const errors = [];
    try {
        for (const [key, field] of Object.entries(schema)) {
            const value = data?.[key];
            const missing = value === undefined || value === null;
            if (missing) {
                if (field.required)
                    errors.push(`"${key}" is required`);
                continue;
            }
            if (!matches(field.type, value)) {
                errors.push(`"${key}" must be ${field.type}, got ${getActualType(value)}`);
            }
        }
    }
    catch {
        // never throw
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=validate.js.map