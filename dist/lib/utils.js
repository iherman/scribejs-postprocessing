"use strict";
/**
 * ## Utility functions
 *
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG = exports.DEBUG = exports.flatten = exports.get_schema = exports.filter_resolutions = void 0;
const config_1 = require("./config");
/**
 * Check whether the resolutions for minutes have already been handled in a previous run. Used to avoid unnecessary regeneration of data.
 *
 * @param refs - Array of minute references (i.e., file names)
 * @param current  - Array of current resolution data objects
 * @return - Array of minute references that must be handled
 */
function filter_resolutions(refs, current) {
    try {
        return refs.filter((ref) => {
            return !current.file_names.includes(ref);
        });
    }
    catch {
        return refs;
    }
}
exports.filter_resolutions = filter_resolutions;
/**
 * Extract the schema.org data from the minutes' preamble, and turn it into a bona fide
 * Javascript object.
 *
 * @param lines - The minutes, broken into an array of individual strings
 */
function get_schema(lines) {
    // try to get the start of the json-ld part
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('json-ld: |')) {
            index = i + 1;
            break;
        }
    }
    if (index > 0) {
        // we found the start section!
        let json_data = '';
        for (; index < lines.length; index++) {
            if (lines[index].startsWith('---')) {
                break;
            }
            else {
                json_data = `${json_data}\n${lines[index]}`;
            }
        }
        return JSON.parse(json_data);
    }
    else {
        return null;
    }
}
exports.get_schema = get_schema;
/**
 * Helper function to "flatten" arrays of arrays into a single array. This method should be used as the callback
 * for a `reduce`.
 *
 * @param accumulator - Accumulated array in a reduce
 * @param currentValue - The next array to be considered
 */
function flatten(accumulator, currentValue) {
    return [...accumulator, ...currentValue];
}
exports.flatten = flatten;
/**
 * Print a debug statement if the [[DO_DEBUG]] flag is set to `true`.
 *
 * @param preamble - "Preamble" text to be printed first
 * @param obj - An object, converted to JSON before printed, together with the preamble. This value may be undefined, in which case only the preamble is printed.
 */
function DEBUG(preamble, obj = undefined) {
    if (config_1.DO_DEBUG) {
        if (obj)
            console.error(`${preamble} ${JSON.stringify(obj)}`);
        else
            console.error(`${preamble}`);
    }
}
exports.DEBUG = DEBUG;
/**
 * Print a log statement if the [[DO_LOG]] flag is set to `true`.
 *
 * @param preamble - "Preamble" text to be printed first
 * @param obj - An object, converted to JSON before printed, together with the preamble. This value may be undefined, in which case only the preamble is printed.
 */
function LOG(preamble, obj = undefined) {
    if (config_1.DO_LOG) {
        if (obj)
            console.log(`--- Scribejs post processing --- ${preamble} ${JSON.stringify(obj)}`);
        else
            console.log(`--- Scribejs post processing --- ${preamble}`);
    }
}
exports.LOG = LOG;
//# sourceMappingURL=utils.js.map