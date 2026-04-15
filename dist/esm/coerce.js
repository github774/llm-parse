"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coerceData = coerceData;
/**
 * Attempts type coercion on data fields where schema type mismatches.
 * Never drops keys. Returns a shallow copy with coerced values where unambiguous.
 */
function coerceData(schema, data) {
    const result = { ...data };
    for (const [key, field] of Object.entries(schema)) {
        const value = result[key];
        if (typeof value !== 'string')
            continue; // only coerce from strings
        if (field.type === 'number') {
            const n = Number(value);
            if (!Number.isNaN(n))
                result[key] = n;
        }
        else if (field.type === 'boolean') {
            if (value === 'true')
                result[key] = true;
            else if (value === 'false')
                result[key] = false;
        }
    }
    return result;
}
//# sourceMappingURL=coerce.js.map