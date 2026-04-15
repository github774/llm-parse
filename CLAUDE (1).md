# llm-parse — Agent Instructions

## Project Overview
A lightweight, zero-dependency NPM package for parsing and validating LLM output.
Solves the problem of LLMs returning malformed, fenced, or padded JSON.
Positioned as the minimal alternative to bloated tools like Instructor and Guardrails.

---

## Hard Constraints

- **Zero runtime dependencies.** No Zod, Ajv, Instructor, or any third-party lib.
  If you are tempted to add a dependency, find a way to do it in plain TypeScript instead.
- **No file exceeds 150 lines.** Split logic before exceeding this.
- **Dual ESM + CJS output.** Both module formats must work on publish.
- **TypeScript only.** No plain JS files in src/.
- **Node built-in test runner only.** No Jest, Vitest, or Mocha.

---

## File Structure

```
llm-parse/
├── src/
│   ├── index.ts       # Main export: llmParse()
│   ├── parse.ts       # stripFences, extractJSON, parseJSON
│   ├── validate.ts    # validate(schema, data)
│   └── types.ts       # All exported types and interfaces
├── tests/
│   └── index.test.ts  # Full test suite
├── dist/              # Build output (do not edit)
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
└── .npmignore
```

---

## Core API Surface

### `llmParse(text, schema?, options?)`
Main function. Always exported as named + default.

### `validate(schema, data)`
Returns `{ valid: boolean, errors: string[] }`. Never throws.

### `ParseError`
Custom error class. Include `raw` field with the original unparsed string.

### Options
```ts
interface LLMParseOptions {
  strict: boolean   // throw on validation failure (default: false)
  coerce: boolean   // attempt type casting, e.g. "42" → 42 (default: false)
}
```

---

## Behavior Rules

- `stripFences` must handle: ```json, ```, and fences with extra whitespace/newlines
- `extractJSON` must handle: JSON buried after explanation text, JSON before a closing sentence
- `parseJSON` must throw `ParseError` (not generic Error) on failure
- `validate` schema types to support: `string`, `number`, `boolean`, `array`, `object`
- Coerce mode: cast strings to number/boolean where unambiguous, never silently drop keys

---

## Error Handling

- All parsing errors throw `ParseError` with `message` and `raw` fields
- Validation never throws — always returns error array
- Strict mode converts validation errors into thrown `ParseError`

---

## What NOT to Build

- Do not add streaming support
- Do not add provider-specific logic (OpenAI, Anthropic, etc.)
- Do not add a retry mechanism in v1
- Do not add a CLI
- Keep it to parsing + validation only

---

## README Requirements

When writing the README, always include:
1. One-liner description
2. Install command
3. Three usage examples (basic, with schema, with options)
4. Comparison table vs Instructor / Guardrails / zod-gpt (deps count, bundle size)
5. "Why llm-parse" section emphasizing zero deps and simplicity

---

## Build & Publish Checklist

- [ ] `npm run build` produces `/dist` with ESM + CJS
- [ ] `package.json` has `main`, `module`, and `exports` fields set correctly
- [ ] `.npmignore` excludes `src/`, `tests/`, `CLAUDE.md`, `tsconfig.json`
- [ ] All tests pass via `node --test`
- [ ] Version is `0.1.0` on first publish
- [ ] `npm publish --access public` from a logged-in session
