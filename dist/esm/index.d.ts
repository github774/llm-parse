import type { Schema, LLMParseOptions } from './types.js';
export { ParseError } from './parse.js';
export { validate } from './validate.js';
export type { Schema, LLMParseOptions, ValidationResult, SchemaField, SchemaType } from './types.js';
export declare function llmParse(text: string, schema?: Schema, options?: LLMParseOptions): unknown;
export default llmParse;
//# sourceMappingURL=index.d.ts.map