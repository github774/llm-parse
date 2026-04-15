"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.ParseError = void 0;
exports.llmParse = llmParse;
// src/index.ts
const parse_js_1 = require("./parse.js");
const validate_js_1 = require("./validate.js");
const coerce_js_1 = require("./coerce.js");
var parse_js_2 = require("./parse.js");
Object.defineProperty(exports, "ParseError", { enumerable: true, get: function () { return parse_js_2.ParseError; } });
var validate_js_2 = require("./validate.js");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validate_js_2.validate; } });
function llmParse(text, schema, options = {}) {
    const { strict = false, coerce = false } = options;
    const stripped = (0, parse_js_1.stripFences)(text);
    const extracted = (0, parse_js_1.extractJSON)(stripped);
    let parsed = (0, parse_js_1.parseJSON)(extracted);
    if (schema) {
        if (coerce) {
            parsed = (0, coerce_js_1.coerceData)(schema, parsed);
        }
        const result = (0, validate_js_1.validate)(schema, parsed);
        if (!result.valid && strict) {
            throw new parse_js_1.ParseError(`Validation failed: ${result.errors.join('; ')}`, text);
        }
    }
    return parsed;
}
exports.default = llmParse;
//# sourceMappingURL=index.js.map