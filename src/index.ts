// src/index.ts
import { stripFences, extractJSON, parseJSON, ParseError } from './parse.ts';
import { validate } from './validate.ts';
import { coerceData } from './coerce.ts';
import type { Schema, LLMParseOptions } from './types.ts';

export { ParseError } from './parse.ts';
export { validate } from './validate.ts';
export type { Schema, LLMParseOptions, ValidationResult, SchemaField, SchemaType } from './types.ts';

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
