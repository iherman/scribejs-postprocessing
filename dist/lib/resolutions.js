"use strict";
/**
 * ## Gathering the resolutions
 *
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.collect_resolutions = exports.filter_resolutions = void 0;
const config_1 = require("./config");
const showdown = require("showdown");
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
        else if (a.date < b.date) {
            return 1;
        }
        else {
            return -1;
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
 * * extracts the URL and the date of the minutes from the preambles in JSON-LD;
 * * extracts the resolution summary lines;
 * * creates an array of [[Resolution]];
 *
 * @param minutes - the minutes for a call, in markdown
 * @returns - resolution data for one call
 *
 */
function get_resolutions(minutes) {
    try {
        const lines = minutes.split('\n');
        const schema = get_schema(lines);
        if (schema === null) {
            config_1.DEBUG(`The JSON-LD preamble is missing or could not be extracted`);
            return [];
        }
        config_1.DEBUG("schema: ", schema);
        const url = schema.url;
        const date = schema.dateCreated;
        if (date === undefined) {
            config_1.DEBUG(`For some reasons the date is missing`);
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
        config_1.DEBUG("Exception: ", e);
        return [];
    }
}
/**
 *
 * Collect all the resolutions. The function calls out, for each minute file, to the [[get_resolutions]] function,
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