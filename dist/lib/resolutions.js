"use strict";
/**
 * ## Gathering the resolutions themselves. See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.collect_resolutions = exports.filter_resolutions = void 0;
const config_1 = require("./config");
const showdown = __importStar(require("showdown"));
const converter = new showdown.Converter({
    omitExtraWLInCodeBlocks: true,
    simplifiedAutoLink: true,
    excludeTrailingPunctuationFromURLs: true,
    literalMidWordUnderscores: true,
    literalMidWordAsterisks: true,
    strikethrough: true,
    ghMentions: true,
});
converter.setFlavor('github');
const url_regexp = /^\s*"url"\s*:\s*"([a-z:\-#@.\/0-9A-Z]*)/;
// This one relies on the data in the JSON-LD header part
// const date_regexp = /^\s*"dateCreated"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})/;
// This one relies on the date statement in the markdown itself.
// Better use this: if the date is not set properly in the IRC log, this value is still set
const date_regexp = /^\s*\*\*Date:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/;
/**
 * Compare resolution objects; to be used in a “sort” method on the array of Resolutions.
 *
 * Sorting takes a decreasing order by year, a decreasing order by meeting date within a year, and finally an increasing order by resolution number
 *
 * @param  a - Left operand
 * @param  b - Right operand
 * @returns - negative, zero, or positive, depending on the comparison result (see the Javascript “sort” method for details)
 */
function sort_resolutions(a, b) {
    if (a.year === b.year) {
        if (a.date === b.date) {
            return a.number - b.number;
        }
        else {
            if (a.date < b.date) {
                return 1;
            }
            else if (a.date > b.date) {
                return -1;
            }
        }
    }
    else {
        return b.year - a.year;
    }
}
/**
 * Check whether the resolutions for minutes have already been handled in a previous run. Used to avoid unnecessary regeneration of data.
 *
 * @param refs - Array of minute references (i.e., file names)
 * @param current  - Array of current resolution data objects
 * @return - Array of minute references that must be handled
 */
function filter_resolutions(refs, current) {
    return refs.filter((ref) => {
        return !current.short_names.includes(ref);
    });
}
exports.filter_resolutions = filter_resolutions;
/**
 * Get the resolution for a minute text (in markdown) of one call.
 * The function relies upon the scribejs format. It:
 *
 * * extracts the URL and the date of the minutes from the preambles in JSON-LD
 * * extracts the resolution summary lines
 * * creates an array of [[Resolution]]
 *
 * @param minutes - the minutes for a call, in markdown
 * @returns - resolution data for one call
 *
 */
function get_resolutions(minutes) {
    const get_match = (line, regexp) => {
        const result = line.match(regexp);
        return (result === null) ? undefined : result[1];
    };
    const find_match = (lines, regexp) => {
        for (let i = 0; i < lines.length; i++) {
            const url = get_match(lines[i], regexp);
            if (url) {
                return url;
            }
        }
        return undefined;
    };
    try {
        const lines = minutes.split('\n');
        const url = find_match(lines, url_regexp);
        const date = find_match(lines, date_regexp);
        if (date === undefined) {
            config_1.DEBUG(`For some reasons the date is missing in ${minutes}`);
            return [];
        }
        const year = date.split('-')[0];
        // eslint-disable-next-line no-multi-spaces
        const resolutions = lines
            .filter((line) => line.startsWith('* [Resolution'))
            .map((line) => line.slice(2)) // remove the markdown list character
            .map((line) => {
            const number = line.split('](')[0].substring("Resolution #".length + 1);
            const text = line.replace(/\[Resolution #[0-9]+\]\(#resolution[0-9]+\):/, '').trim();
            return {
                year: Number.parseInt(year),
                date,
                number: Number.parseInt(number),
                text: converter.makeHtml(text).replace('<p>', '').replace('</p>', ''),
                url: `${url}#resolution${number}`,
                call: '' // to be set in in the callee of this function!
            };
        });
        return resolutions;
    }
    catch (e) {
        console.error(`${e}`);
        return [];
    }
}
/**
 *
 * Collect all the resolutions. The function calls out, for each minute file, to the [[get_resolutions] function,
 * and flattens all such resolutions into a single large resolution. The set of resolution is also sorted (using [[sort_resolutions]]).
 *
 * @param file_names - List of the minute file names, i.e., the base name of the minute file in its repository
 * @param get_data - A function returning the markdown content of the minutes in a Promise. The function itself either uses the local file system read or a fetch to the repository, depending on whether this function is called from [[local_repos]] or [[github_repos]], respectively.
 * @returns  - List of resolutions
 *
 * @async
 */
async function collect_resolutions(file_names, get_data) {
    const minutes_promises = file_names.map((file_name) => get_data(file_name));
    const minutes = await Promise.all(minutes_promises);
    const resolutions = minutes
        // extract all resolutions from the markdown text, returning an array of resolution objects
        .map(get_resolutions)
        // add the group name to each resolution, based on the file name
        .map((res_array, index) => {
        // extract the group name from the file short name
        const call = file_names[index].split('.')[0].slice(11);
        return res_array.map((resolution) => {
            resolution.call = call;
            return resolution;
        });
    })
        // turn array of arrays into a single array
        .reduce((accumulator, currentValue) => [...accumulator, ...currentValue], [])
        // sort the resolution.
        .sort(sort_resolutions);
    return {
        short_names: file_names,
        resolutions,
    };
}
exports.collect_resolutions = collect_resolutions;
//# sourceMappingURL=resolutions.js.map