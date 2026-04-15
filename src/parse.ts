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
 * Finds the first { or [ character and the last matching } or ] and returns
 * the substring. Falls back to the trimmed input if no bracket pair found.
 */
export function extractJSON(text: string): string {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  let start = -1;
  let closing: string;

  if (firstBrace === -1 && firstBracket === -1) return text.trim();

  if (firstBrace === -1) { start = firstBracket; closing = ']'; }
  else if (firstBracket === -1) { start = firstBrace; closing = '}'; }
  else if (firstBrace < firstBracket) { start = firstBrace; closing = '}'; }
  else { start = firstBracket; closing = ']'; }

  const end = text.lastIndexOf(closing);
  if (end === -1 || end < start) return text.trim();

  return text.slice(start, end + 1).trim();
}

/**
 * Parses a JSON string, throwing ParseError on failure.
 */
export function parseJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ParseError(`Failed to parse JSON: ${text.slice(0, 80)}`, text);
  }
}
