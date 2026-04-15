# llm-parse

Lightweight, zero-dependency parser and validator for LLM JSON output.
Strips fences, extracts buried JSON, and optionally validates against a simple schema.

## Install

```bash
npm install llm-parse
```

## Usage

### Basic

```typescript
import llmParse from 'llm-parse';

const result = llmParse('```json\n{"name":"Alice"}\n```');
// → { name: 'Alice' }
```

### With schema

```typescript
import llmParse from 'llm-parse';

const schema = {
  name: { type: 'string', required: true },
  age:  { type: 'number' },
};

const result = llmParse(
  'Sure! Here is the data: {"name":"Bob","age":25}',
  schema
);
// → { name: 'Bob', age: 25 }
```

### With options

```typescript
import llmParse from 'llm-parse';

const schema = { score: { type: 'number' } };

// coerce: cast "42" → 42 automatically
// strict: throw ParseError if validation fails
const result = llmParse(
  '{"score":"98"}',
  schema,
  { coerce: true, strict: true }
);
// → { score: 98 }
```

## Why llm-parse?

LLMs regularly return JSON wrapped in markdown fences, prefaced with explanation text, or with values in the wrong type. `llm-parse` handles all of that in < 200 lines with **no runtime dependencies**.

| | llm-parse | zod-gpt | Instructor | Guardrails |
|---|---|---|---|---|
| Runtime deps | **0** | 1+ | 5+ | 20+ |
| Bundle (min) | **~3 kB** | ~50 kB | ~200 kB | ~500 kB |
| Fence stripping | ✅ | ❌ | ✅ | ✅ |
| Zero-config | ✅ | ❌ | ❌ | ❌ |
| Streaming | ❌ | ✅ | ✅ | ✅ |

## API

### `llmParse(text, schema?, options?)`

| Param | Type | Description |
|---|---|---|
| `text` | `string` | Raw LLM output |
| `schema` | `Schema` | Optional field type map |
| `options.strict` | `boolean` | Throw on validation failure (default `false`) |
| `options.coerce` | `boolean` | Auto-cast string values (default `false`) |

Returns parsed value as `unknown`. Cast to your type after validation.

### `validate(schema, data)`

Returns `{ valid: boolean, errors: string[] }`. Never throws.

### `ParseError`

Extends `Error`. Has `raw: string` with the original unparsed text.
