// tests/index.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripFences, extractJSON, parseJSON, ParseError } from '../src/parse.ts';

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
