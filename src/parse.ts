// src/parse.ts

export class ParseError extends Error {
  raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = 'ParseError';
    this.raw = raw;
  }
}

/**
 * Removes markdown code fences (```json ... ``` or ``` ... ```) from a string.
 */
export function stripFences(text: string): string {
  const fencePattern = /^\s*```(?:json)?\s*\r?\n?([\s\S]*?)\n?\s*```\s*$/;
  const match = text.match(fencePattern);
  return match ? match[1].trim() : text.trim();
}

/**
 * Finds the first { or [ and walks forward tracking bracket depth to locate
 * the correct matching close. Ignores brackets inside strings.
 * Falls back to the trimmed input if no valid bracket pair is found.
 */
export function extractJSON(text: string): string {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  let openChar: string;
  let closeChar: string;
  let start: number;

  if (firstBrace === -1 && firstBracket === -1) return text.trim();

  if (firstBrace === -1) { start = firstBracket; openChar = '['; closeChar = ']'; }
  else if (firstBracket === -1) { start = firstBrace; openChar = '{'; closeChar = '}'; }
  else if (firstBrace < firstBracket) { start = firstBrace; openChar = '{'; closeChar = '}'; }
  else { start = firstBracket; openChar = '['; closeChar = ']'; }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === openChar) depth++;
    if (ch === closeChar) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1).trim();
    }
  }

  return text.trim();
}

/**
 * Strips fences, extracts JSON from surrounding text, parses, and returns the
 * result. Throws ParseError (with the original text in `.raw`) on failure.
 */
export function parseJSON(text: string): unknown {
  const cleaned = extractJSON(stripFences(text));
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new ParseError(`Failed to parse JSON: ${cleaned.slice(0, 80)}`, text);
  }
}
