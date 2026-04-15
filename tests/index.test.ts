// tests/index.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripFences, extractJSON, parseJSON, ParseError } from '../src/parse.ts';
import { validate } from '../src/validate.ts';
import { coerceData } from '../src/coerce.ts';
import type { Schema } from '../src/types.ts';
import llmParse, { llmParse as namedLlmParse } from '../src/index.ts';

// ---------------------------------------------------------------------------
// stripFences
// ---------------------------------------------------------------------------

describe('stripFences', () => {
  it('strips ```json ... ``` fences', () => {
    assert.equal(stripFences('```json\n{"a":1}\n```'), '{"a":1}');
  });

  it('strips plain ``` fences', () => {
    assert.equal(stripFences('```\n{"a":1}\n```'), '{"a":1}');
  });

  it('strips fences with extra whitespace around the tag', () => {
    assert.equal(stripFences('  ```json  \n{"a":1}\n```  '), '{"a":1}');
  });

  it('strips fences with trailing newline inside', () => {
    assert.equal(stripFences('```json\n{"a":1}\n\n```'), '{"a":1}');
  });

  it('strips fences with non-json language tags (typescript, javascript, etc.)', () => {
    assert.equal(stripFences('```typescript\n{"a":1}\n```'), '{"a":1}');
    assert.equal(stripFences('```javascript\n{"a":1}\n```'), '{"a":1}');
    assert.equal(stripFences('```python\n{"a":1}\n```'), '{"a":1}');
  });

  it('strips fences with CRLF line endings', () => {
    assert.equal(stripFences('```json\r\n{"a":1}\r\n```'), '{"a":1}');
  });

  it('returns unclosed fence unchanged', () => {
    const s = '```json\n{"a":1}';
    assert.equal(stripFences(s), s);
  });

  it('returns trimmed string when no fences present', () => {
    assert.equal(stripFences('  {"a":1}  '), '{"a":1}');
  });

  it('preserves content that contains backticks but is not a fence', () => {
    const s = 'use `x` here';
    assert.equal(stripFences(s), s);
  });
});

// ---------------------------------------------------------------------------
// extractJSON
// ---------------------------------------------------------------------------

describe('extractJSON', () => {
  it('extracts object buried after explanation text', () => {
    assert.equal(
      extractJSON('Sure, here is the result:\n{"name":"Alice"}'),
      '{"name":"Alice"}',
    );
  });

  it('extracts object with trailing sentence', () => {
    assert.equal(
      extractJSON('{"ok":true}\nHope that helps!'),
      '{"ok":true}',
    );
  });

  it('extracts object surrounded by text on both sides', () => {
    assert.equal(
      extractJSON('Here you go: {"x":1} — enjoy!'),
      '{"x":1}',
    );
  });

  it('extracts JSON array', () => {
    assert.equal(extractJSON('Here: [1,2,3]'), '[1,2,3]');
  });

  it('prefers object when { appears before [', () => {
    // firstBrace < firstBracket → slices from { to last }, ignoring the array
    assert.equal(extractJSON('{"a":1} and [1,2]'), '{"a":1}');
    assert.equal(extractJSON('Result: {"a":1} done.'), '{"a":1}');
  });

  it('returns trimmed input when no brackets found', () => {
    assert.equal(extractJSON('  no json here  '), 'no json here');
  });

  it('stops at the correct closing bracket, ignoring stray ones after', () => {
    // lastIndexOf would have grabbed the trailing }, depth-tracking stops at the right one
    assert.equal(extractJSON('{"a":1} some text }'), '{"a":1}');
  });

  it('handles brackets inside string values correctly', () => {
    assert.equal(extractJSON('{"key":"val}ue"}'), '{"key":"val}ue"}');
  });

  it('handles escaped quotes inside string values', () => {
    assert.equal(extractJSON('{"k":"say \\"hi\\""}'), '{"k":"say \\"hi\\""}');
  });

  it('handles escaped backslashes inside string values', () => {
    assert.equal(extractJSON('{"p":"C:\\\\file"}'), '{"p":"C:\\\\file"}');
  });

  it('handles array of objects', () => {
    assert.equal(extractJSON('[{"a":1},{"b":2}]'), '[{"a":1},{"b":2}]');
  });

  it('handles empty object', () => {
    assert.equal(extractJSON('{}'), '{}');
  });

  it('handles empty array', () => {
    assert.equal(extractJSON('[]'), '[]');
  });

  it('returns input unchanged when it is already a JSON object', () => {
    assert.equal(extractJSON('{"a":1}'), '{"a":1}');
  });
});

// ---------------------------------------------------------------------------
// parseJSON — including malformed JSON cases
// ---------------------------------------------------------------------------

describe('parseJSON', () => {
  it('parses a valid JSON object', () => {
    assert.deepEqual(parseJSON('{"a":1}'), { a: 1 });
  });

  it('parses fenced JSON end-to-end', () => {
    assert.deepEqual(parseJSON('```json\n{"ok":true}\n```'), { ok: true });
  });

  it('parses JSON buried in explanation text', () => {
    assert.deepEqual(
      parseJSON('Here is the answer:\n{"score":99}\nDone.'),
      { score: 99 },
    );
  });

  it('throws ParseError (not generic Error) for completely invalid input', () => {
    assert.throws(() => parseJSON('not json at all'), ParseError);
  });

  it('throws ParseError for truncated JSON', () => {
    assert.throws(() => parseJSON('{"name":"Alice"'), ParseError);
  });

  it('throws ParseError for trailing comma (invalid JSON)', () => {
    assert.throws(() => parseJSON('{"a":1,}'), ParseError);
  });

  it('ParseError.raw holds the original pre-clean input', () => {
    try {
      parseJSON('garbage');
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e instanceof ParseError);
      assert.equal((e as ParseError).raw, 'garbage');
    }
  });

  it('ParseError.raw holds original text even when fenced', () => {
    const input = '```json\n{bad}\n```';
    try {
      parseJSON(input);
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e instanceof ParseError);
      assert.equal((e as ParseError).raw, input);
    }
  });

  it('ParseError.name is "ParseError"', () => {
    try {
      parseJSON('bad');
    } catch (e) {
      assert.equal((e as ParseError).name, 'ParseError');
    }
  });
});

// ---------------------------------------------------------------------------
// validate — schema pass / fail
// ---------------------------------------------------------------------------

describe('validate', () => {
  it('passes when all fields match schema', () => {
    const schema: Schema = { name: { type: 'string' }, age: { type: 'number' } };
    assert.deepEqual(validate(schema, { name: 'Alice', age: 30 }), { valid: true, errors: [] });
  });

  it('fails with error message naming the field when type is wrong', () => {
    const schema: Schema = { name: { type: 'string' } };
    const result = validate(schema, { name: 123 });
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('name'));
  });

  it('fails for missing required field', () => {
    const schema: Schema = { name: { type: 'string', required: true } };
    const result = validate(schema, {});
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('name'));
  });

  it('passes when optional field is absent', () => {
    const schema: Schema = { name: { type: 'string' } };
    assert.deepEqual(validate(schema, {}), { valid: true, errors: [] });
  });

  it('accumulates errors for multiple bad fields', () => {
    const schema: Schema = {
      name: { type: 'string', required: true },
      age: { type: 'number', required: true },
    };
    const result = validate(schema, {});
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 2);
  });

  it('validates array type — array passes, string fails', () => {
    const schema: Schema = { tags: { type: 'array' } };
    assert.equal(validate(schema, { tags: [1, 2] }).valid, true);
    assert.equal(validate(schema, { tags: 'oops' }).valid, false);
  });

  it('validates object type — plain object passes, array fails', () => {
    const schema: Schema = { meta: { type: 'object' } };
    assert.equal(validate(schema, { meta: {} }).valid, true);
    assert.equal(validate(schema, { meta: [] }).valid, false); // array is not object
  });

  it('validates boolean type', () => {
    const schema: Schema = { active: { type: 'boolean' } };
    assert.equal(validate(schema, { active: true }).valid, true);
    assert.equal(validate(schema, { active: 'yes' }).valid, false);
  });

  it('ignores extra keys not in schema', () => {
    const schema: Schema = { name: { type: 'string' } };
    assert.equal(validate(schema, { name: 'Alice', extra: 99 }).valid, true);
  });

  it('never throws — even with null data', () => {
    assert.doesNotThrow(() =>
      validate({} as Schema, null as unknown as Record<string, unknown>),
    );
  });

  it('null value fails type check rather than being silently skipped', () => {
    const schema: Schema = { meta: { type: 'object' } };
    // null is present in data but is not a valid object
    const result = validate(schema, { meta: null } as unknown as Record<string, unknown>);
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('meta'));
  });
});

// ---------------------------------------------------------------------------
// coercion
// ---------------------------------------------------------------------------

describe('coerceData', () => {
  it('coerces "42" → 42 when schema expects number', () => {
    const schema: Schema = { age: { type: 'number' } };
    assert.equal(coerceData(schema, { age: '42' }).age, 42);
  });

  it('coerces "3.14" → 3.14', () => {
    const schema: Schema = { pi: { type: 'number' } };
    assert.equal(coerceData(schema, { pi: '3.14' }).pi, 3.14);
  });

  it('coerces "true" → true and "false" → false', () => {
    const schema: Schema = { active: { type: 'boolean' } };
    assert.equal(coerceData(schema, { active: 'true' }).active, true);
    assert.equal(coerceData(schema, { active: 'false' }).active, false);
  });

  it('does not coerce ambiguous string to number', () => {
    const schema: Schema = { age: { type: 'number' } };
    assert.equal(coerceData(schema, { age: 'not-a-number' }).age, 'not-a-number');
  });

  it('does not coerce non-string values', () => {
    const schema: Schema = { count: { type: 'number' } };
    assert.equal(coerceData(schema, { count: 5 }).count, 5); // already a number
  });

  it('preserves keys not in schema', () => {
    const schema: Schema = { age: { type: 'number' } };
    const result = coerceData(schema, { age: '5', extra: 'keep' });
    assert.ok('extra' in result);
    assert.equal(result.extra, 'keep');
  });

  it('does not mutate the original data object', () => {
    const schema: Schema = { age: { type: 'number' } };
    const data = { age: '42' };
    coerceData(schema, data);
    assert.equal(data.age, '42'); // unchanged
  });

  it('does not coerce empty string to 0', () => {
    const schema: Schema = { n: { type: 'number' } };
    assert.equal(coerceData(schema, { n: '' }).n, '');
  });

  it('does not coerce whitespace-only string to 0', () => {
    const schema: Schema = { n: { type: 'number' } };
    assert.equal(coerceData(schema, { n: '   ' }).n, '   ');
  });

  it('does not coerce "Infinity" to Infinity (not a valid JSON number)', () => {
    const schema: Schema = { n: { type: 'number' } };
    assert.equal(coerceData(schema, { n: 'Infinity' }).n, 'Infinity');
  });

  it('does not coerce "-Infinity" (not a valid JSON number)', () => {
    const schema: Schema = { n: { type: 'number' } };
    assert.equal(coerceData(schema, { n: '-Infinity' }).n, '-Infinity');
  });

  it('does coerce "0" and negative number strings correctly', () => {
    const schema: Schema = { n: { type: 'number' } };
    assert.equal(coerceData(schema, { n: '0' }).n, 0);
    assert.equal(coerceData(schema, { n: '-1' }).n, -1);
  });
});

// ---------------------------------------------------------------------------
// llmParse — integration (all options combined)
// ---------------------------------------------------------------------------

describe('llmParse', () => {
  // --- fenced JSON ---

  it('parses clean JSON string', () => {
    assert.deepEqual(llmParse('{"name":"Alice","age":30}'), { name: 'Alice', age: 30 });
  });

  it('strips ```json fences', () => {
    assert.deepEqual(llmParse('```json\n{"ok":true}\n```'), { ok: true });
  });

  it('strips plain ``` fences', () => {
    assert.deepEqual(llmParse('```\n{"ok":true}\n```'), { ok: true });
  });

  // --- JSON buried in text ---

  it('extracts JSON from preamble text', () => {
    assert.deepEqual(llmParse('Here you go:\n{"x":1}\nDone.'), { x: 1 });
  });

  it('handles fenced JSON with surrounding prose', () => {
    assert.deepEqual(
      llmParse('Sure:\n```json\n{"y":2}\n```\nHope that helps!'),
      { y: 2 },
    );
  });

  // --- malformed JSON ---

  it('throws ParseError for garbage input', () => {
    assert.throws(() => llmParse('not json'), ParseError);
  });

  it('throws ParseError for truncated JSON', () => {
    assert.throws(() => llmParse('{"name":"Alice"'), ParseError);
  });

  it('ParseError.raw holds the original unmodified text', () => {
    const input = '```json\n{bad}\n```';
    try {
      llmParse(input);
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e instanceof ParseError);
      assert.equal((e as ParseError).raw, input);
    }
  });

  // --- schema validation ---

  it('returns data unchanged when schema passes', () => {
    const schema: Schema = { name: { type: 'string' } };
    assert.deepEqual(llmParse('{"name":"Bob"}', schema), { name: 'Bob' });
  });

  it('does not throw on validation failure in non-strict mode (default)', () => {
    const schema: Schema = { name: { type: 'number' } };
    assert.doesNotThrow(() => llmParse('{"name":"Bob"}', schema));
  });

  // --- strict mode ---

  it('throws ParseError in strict mode when required field is missing', () => {
    const schema: Schema = { name: { type: 'string', required: true } };
    assert.throws(
      () => llmParse('{}', schema, { strict: true }),
      ParseError,
    );
  });

  it('throws ParseError in strict mode when type is wrong', () => {
    const schema: Schema = { name: { type: 'number', required: true } };
    assert.throws(
      () => llmParse('{"name":"Bob"}', schema, { strict: true }),
      ParseError,
    );
  });

  it('strict mode error message contains the validation failure detail', () => {
    const schema: Schema = { name: { type: 'number', required: true } };
    try {
      llmParse('{"name":"Bob"}', schema, { strict: true });
      assert.fail('should have thrown');
    } catch (e) {
      assert.ok(e instanceof ParseError);
      assert.ok((e as ParseError).message.includes('name'));
    }
  });

  it('does not throw in strict mode when validation passes', () => {
    const schema: Schema = { name: { type: 'string', required: true } };
    assert.doesNotThrow(() =>
      llmParse('{"name":"Alice"}', schema, { strict: true }),
    );
  });

  // --- coercion ---

  it('coerces string to number when coerce:true', () => {
    const schema: Schema = { age: { type: 'number' } };
    const result = llmParse('{"age":"42"}', schema, { coerce: true }) as Record<string, unknown>;
    assert.equal(result.age, 42);
  });

  it('coerces string to boolean when coerce:true', () => {
    const schema: Schema = { active: { type: 'boolean' } };
    const result = llmParse('{"active":"true"}', schema, { coerce: true }) as Record<string, unknown>;
    assert.equal(result.active, true);
  });

  it('coerce + strict: passes after successful coercion', () => {
    const schema: Schema = { score: { type: 'number', required: true } };
    assert.doesNotThrow(() =>
      llmParse('{"score":"99"}', schema, { coerce: true, strict: true }),
    );
  });

  it('coerce + strict: throws when coercion cannot fix the type', () => {
    const schema: Schema = { score: { type: 'number', required: true } };
    assert.throws(
      () => llmParse('{"score":"not-a-number"}', schema, { coerce: true, strict: true }),
      ParseError,
    );
  });

  // --- exports ---

  it('is exported as both named and default', () => {
    assert.equal(typeof llmParse, 'function');
    assert.equal(typeof namedLlmParse, 'function');
  });
});
