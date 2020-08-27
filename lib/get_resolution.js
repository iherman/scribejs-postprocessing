'use strict';

const url_regexp = /^\s*"url"\s*:\s*"([a-z:\-#@.\/0-9A-Z]*)/;
const date_regexp = /^\s*"dateCreated"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})/;

/**
 * Get the resolution for a minute text (in markdown). The function relies upon the scribejs format. It:
 *
 * * extracts the URL and the date of the minutes from the preambles in JSON-LD
 * * extracts the resolution summary lines
 * * creates the return object which:
 *     * is keyed with the date of the minutes
 *     * the key refers to an object, containing the url and resolutions fields. The latter is an Array of resolution lines.
 *
 * @param {String} minutes - the minutes for a call, in markdown
 * @returns {Object} - resolution data for one call
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
    const lines = minutes.split('\n');
    const url = find_match(lines, url_regexp);
    const date = find_match(lines, date_regexp);
    const resolutions = lines
        .filter((line) => line.startsWith('* [Resolution'))
        // eslint-disable-next-line no-multi-spaces
        .map((line) => line.slice(2))                                      // remove the markdown list character
        // eslint-disable-next-line max-len
        .map((line) => line.replace(/\((#[a-zA-z0-9]*)\)/, `(${url}$1)`)); // replace the relative URI for the resolution with the absolute one
    const retval = {};
    retval[date] = { url, resolutions };
    return retval;
}

/* -------------------------------------------------------------------------------- */
module.exports = { get_resolutions };

