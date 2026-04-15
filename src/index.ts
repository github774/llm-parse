// src/index.ts
import { stripFences, extractJSON, parseJSON, ParseError } from './parse.js';
import { validate } from './validate.js';
import { coerceData } from './coerce.js';
import type { Schema, LLMParseOptions } from './types.js';

export { ParseError } from './parse.js';
export { validate } from './validate.js';
export type { Schema, LLMParseOptions, ValidationResult, SchemaField, SchemaType } from './types.js';

export function llmParse(
  text: string,
  schema?: Schema,
  options: LLMParseOptions = {}
): unknown {
  const { strict = false, coerce = false } = options;

  const stripped = stripFences(text);
  const extracted = extractJSON(stripped);
  let parsed = parseJSON(extracted) as Record<string, unknown>;

  if (schema) {
    if (coerce) {
      parsed = coerceData(schema, parsed) as Record<string, unknown>;
    }
    const result = validate(schema, parsed);
    if (!result.valid && strict) {
      throw new ParseError(
        `Validation failed: ${result.errors.join('; ')}`,
        text
      );
    }
  }

  return parsed;
}

export default llmParse;
