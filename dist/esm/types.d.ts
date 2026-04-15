export interface LLMParseOptions {
    /** Throw ParseError on validation failure. Default: false */
    strict?: boolean;
    /** Attempt type coercion (e.g. "42" → 42). Default: false */
    coerce?: boolean;
}
export type SchemaType = 'string' | 'number' | 'boolean' | 'array' | 'object';
export interface SchemaField {
    type: SchemaType;
    required?: boolean;
}
export type Schema = Record<string, SchemaField>;
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
//# sourceMappingURL=types.d.ts.map