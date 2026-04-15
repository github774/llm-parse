export declare class ParseError extends Error {
    raw: string;
    constructor(message: string, raw: string);
}
/**
 * Removes markdown code fences (```json ... ``` or ``` ... ```) from a string.
 */
export declare function stripFences(text: string): string;
/**
 * Finds the first { or [ character and the last matching } or ] and returns
 * the substring. Falls back to the trimmed input if no bracket pair found.
 */
export declare function extractJSON(text: string): string;
/**
 * Parses a JSON string, throwing ParseError on failure.
 */
export declare function parseJSON(text: string): unknown;
//# sourceMappingURL=parse.d.ts.map