# llm-parse

LLMs don't return clean JSON. They wrap it in markdown fences, preface it with
"Sure, here's the data:", append "Hope that helps!", and occasionally stringify
numbers as `"42"` instead of `42`. Every production LLM integration has a
hand-rolled version of the same cleanup code.

Existing validators (Instructor, Guardrails, zod-gpt) solve this — but they
pull in dozens of dependencies and hundreds of kilobytes to do it. If all you
need is reliable JSON extraction and lightweight field validation, that's a lot
of weight.

**llm-parse** is the minimal alternative: strip fences, extract JSON, validate
fields. Zero runtime dependencies. ~3 kB minified.

```bash
npm install @amars1238/llm-parse
```

---

## Examples

### 1. Fenced JSON from a chat model

Models like GPT-4 and Claude habitually wrap JSON in markdown code blocks.
`llmParse` strips the fences before parsing.

```typescript
import llmParse from '@amars1238/llm-parse';

const raw = `
Sure! Here is the JSON you asked for:

\`\`\`json
{
  "name": "Alice",
  "role": "engineer"
}
\`\`\`
`;

const result = llmParse(raw);
// → { name: 'Alice', role: 'engineer' }
```

### 2. Schema validation — catching bad output before it reaches your app

Pass a schema to validate field types and required fields. In non-strict mode
(the default), validation errors are available without throwing.

```typescript
import llmParse, { validate, ParseError } from '@amars1238/llm-parse';
import type { Schema } from 'llm-parse';

const schema: Schema = {
  name:  { type: 'string',  required: true },
  score: { type: 'number',  required: true },
  tags:  { type: 'array' },
};

// JSON buried after explanation text — extracted automatically
const raw = 'Here is the structured output: {"name":"Bob","score":91,"tags":["a","b"]}';

const data = llmParse(raw, schema) as { name: string; score: number; tags: string[] };
// → { name: 'Bob', score: 91, tags: ['a', 'b'] }

// Check validation separately without strict mode
const { valid, errors } = validate(schema, { name: 'Bob' }); // missing score
// → { valid: false, errors: ['"score" is required'] }
```

### 3. Coercion + strict mode — enforcing a contract

Models sometimes return numbers as strings (`"score": "91"`). Coerce mode
fixes unambiguous mismatches. Strict mode turns any remaining validation
failure into a thrown `ParseError`.

```typescript
import llmParse, { ParseError } from 'llm-parse';

const schema = {
  score:  { type: 'number',  required: true },
  active: { type: 'boolean', required: true },
};

try {
  // Model returned numbers and booleans as strings
  const result = llmParse(
    '{"score":"91","active":"true"}',
    schema,
    { coerce: true, strict: true },
  );
  // → { score: 91, active: true }
} catch (e) {
  if (e instanceof ParseError) {
    console.error('LLM output did not match schema:', e.message);
    console.error('Original output was:', e.raw);
  }
}
```

---

## Why llm-parse?

| | **llm-parse** | zod-gpt | Instructor (JS) | Guardrails (Python) |
|---|:---:|:---:|:---:|:---:|
| Runtime dependencies | **0** | 1 (zod) | 5+ | 20+ |
| Bundle size (min) | **~3 kB** | ~55 kB | ~200 kB | N/A |
| Fence stripping | ✅ | ❌ | ✅ | ✅ |
| Buried JSON extraction | ✅ | ❌ | ❌ | ❌ |
| Type coercion | ✅ | ❌ | ❌ | ✅ |
| Zero config | ✅ | ❌ | ❌ | ❌ |
| Streaming support | ❌ | ✅ | ✅ | ✅ |
| Retry on failure | ❌ | ✅ | ✅ | ✅ |

**The trade-off is explicit.** If you need automatic retries, streaming
validation, or provider-specific features, use Instructor or Guardrails.
If you need a reliable `JSON.parse` that actually works on LLM output without
adding a dependency tree, use llm-parse.

---

## API

### `llmParse(text, schema?, options?)`

Strips fences, extracts JSON from surrounding text, parses it, and optionally
validates against a schema.

```typescript
llmParse(text: string, schema?: Schema, options?: LLMParseOptions): unknown
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | Raw LLM output |
| `schema` | `Schema` | `undefined` | Field type constraints |
| `options.strict` | `boolean` | `false` | Throw `ParseError` on validation failure |
| `options.coerce` | `boolean` | `false` | Cast `"42"` → `42`, `"true"` → `true` (strings only — non-string values are left unchanged) |

Returns `unknown`. Cast to your type after validation.

Throws `ParseError` if the text cannot be parsed as JSON, or if `strict: true`
and validation fails.

---

### `validate(schema, data)`

Validates a plain object against a schema. Never throws.

```typescript
validate(schema: Schema, data: Record<string, unknown>): ValidationResult
// → { valid: boolean, errors: string[] }
```

---

### `Schema`

```typescript
type Schema = Record<string, {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
}>
```

---

### `ParseError`

```typescript
class ParseError extends Error {
  raw: string; // the original unmodified input text
}
```

Thrown by `llmParse` when JSON parsing fails, or when `strict: true` and
schema validation fails. `raw` always holds the original text before any
fence-stripping or extraction.

---

## How it works

1. **`stripFences`** — removes ` ```json ` / ` ``` ` wrappers (handles extra
   whitespace, Windows line endings, trailing newlines)
2. **`extractJSON`** — scans for the first `{` or `[` and last matching `}` or
   `]`, discarding any surrounding prose
3. **`JSON.parse`** — parses the cleaned string; wraps any error in `ParseError`
4. **`coerceData`** *(optional)* — walks the parsed object, casting string
   values to the schema's expected type where unambiguous
5. **`validate`** *(optional)* — checks types and required fields, returns an
   error list without throwing

Steps 1–3 happen inside `parseJSON`. Steps 4–5 are applied by `llmParse` when
a schema is provided.
