"use strict";
// src/parse.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseError = void 0;
exports.stripFences = stripFences;
exports.extractJSON = extractJSON;
exports.parseJSON = parseJSON;
class ParseError extends Error {
    constructor(message, raw) {
        super(message);
        this.name = 'ParseError';
        this.raw = raw;
    }
}
exports.ParseError = ParseError;
/**
 * Removes markdown code fences (```json ... ``` or ``` ... ```) from a string.
 */
function stripFences(text) {
    const fencePattern = /^\s*```(?:json)?\s*\r?\n?([\s\S]*?)\n?\s*```\s*$/;
    const match = text.match(fencePattern);
    return match ? match[1].trim() : text.trim();
}
/**
 * Finds the first { or [ character and the last matching } or ] and returns
 * the substring. Falls back to the trimmed input if no bracket pair found.
 */
function extractJSON(text) {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    let closing;
    if (firstBrace === -1 && firstBracket === -1)
        return text.trim();
    if (firstBrace === -1) {
        start = firstBracket;
        closing = ']';
    }
    else if (firstBracket === -1) {
        start = firstBrace;
        closing = '}';
    }
    else if (firstBrace < firstBracket) {
        start = firstBrace;
        closing = '}';
    }
    else {
        start = firstBracket;
        closing = ']';
    }
    const end = text.lastIndexOf(closing);
    if (end === -1 || end < start)
        return text.trim();
    return text.slice(start, end + 1).trim();
}
/**
 * Parses a JSON string, throwing ParseError on failure.
 */
function parseJSON(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        throw new ParseError(`Failed to parse JSON: ${text.slice(0, 80)}`, text);
    }
}
//# sourceMappingURL=parse.js.map