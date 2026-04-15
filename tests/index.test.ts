// tests/index.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripFences, extractJSON, parseJSON, ParseError } from '../src/parse.ts';
import { validate } from '../src/validate.ts';
import type { Schema } from '../src/types.ts';

describe('stripFences', () => {
  it('strips ```json ... ``` fences', () => {
    const input = '```json\n{"a":1}\n```';
    assert.equal(stripFences(input), '{"a":1}');
  });

  it('strips plain ``` fences', () => {
    assert.equal(stripFences('```\n{"a":1}\n```'), '{"a":1}');
  });

  it('strips fences with extra whitespace', () => {
    assert.equal(stripFences('  ```json  \n{"a":1}\n```  '), '{"a":1}');
  });

  it('returns unchanged string when no fences', () => {
    assert.equal(stripFences('{"a":1}'), '{"a":1}');
  });
});

describe('extractJSON', () => {
  it('extracts JSON buried after explanation text', () => {
    const input = 'Sure, here is the result:\n{"name":"Alice"}';
    assert.equal(extractJSON(input), '{"name":"Alice"}');
  });

  it('extracts JSON before a closing sentence', () => {
    const input = '{"ok":true}\nHope that helps!';
    assert.equal(extractJSON(input), '{"ok":true}');
  });

  it('extracts JSON array', () => {
    const input = 'Here: [1,2,3]';
    assert.equal(extractJSON(input), '[1,2,3]');
  });

  it('returns the string unchanged when it is already JSON', () => {
    assert.equal(extractJSON('{"a":1}'), '{"a":1}');
  });
});

describe('parseJSON', () => {
  it('parses valid JSON', () => {
    assert.deepEqual(parseJSON('{"a":1}'), { a: 1 });
  });

  it('throws ParseError on invalid JSON', () => {
    assert.throws(() => parseJSON('not json'), ParseError);
  });

  it('ParseError has raw field', () => {
    try {
      parseJSON('bad');
    } catch (e) {
      assert.ok(e instanceof ParseError);
      assert.equal((e as ParseError).raw, 'bad');
    }
  });
});

describe('validate', () => {
  it('returns valid:true for matching schema', () => {
    const schema: Schema = { name: { type: 'string' }, age: { type: 'number' } };
    const result = validate(schema, { name: 'Alice', age: 30 });
    assert.deepEqual(result, { valid: true, errors: [] });
  });

  it('returns errors for wrong types', () => {
    const schema: Schema = { name: { type: 'string' } };
    const result = validate(schema, { name: 123 });
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('name'));
  });

  it('returns errors for missing required fields', () => {
    const schema: Schema = { name: { type: 'string', required: true } };
    const result = validate(schema, {});
    assert.equal(result.valid, false);
    assert.ok(result.errors[0].includes('name'));
  });

  it('validates array type', () => {
    const schema: Schema = { tags: { type: 'array' } };
    assert.deepEqual(validate(schema, { tags: [1, 2] }), { valid: true, errors: [] });
    assert.equal(validate(schema, { tags: 'oops' }).valid, false);
  });

  it('validates object type', () => {
    const schema: Schema = { meta: { type: 'object' } };
    assert.deepEqual(validate(schema, { meta: {} }), { valid: true, errors: [] });
    assert.equal(validate(schema, { meta: [] }).valid, false);
  });

  it('never throws', () => {
    assert.doesNotThrow(() => validate({} as Schema, null as unknown as Record<string, unknown>));
  });
});
