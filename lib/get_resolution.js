'use strict';

const url_regexp = /^\s*"url"\s*:\s*"([a-z:\-#@.\/0-9A-Z]*)/;
const date_regexp = /^\s*"dateCreated"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})/;

/**
 * Get the resolution for a minute text (in markdown). The function relies upon the scribejs format. It:
 *
 * * extracts the URL and the date of the minutes from the preambles in JSON-LD
 * * extracts the resolution summary lines
 * * creates the return object which:
 *     * is keyed with year
 *     * the value is an array of objects, one per resolution. Each object contains the url, text, date, and (resolution) number fields.
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
    const url  = find_match(lines, url_regexp);
    const date = find_match(lines, date_regexp);
    const year = date.split('-')[0];
    const resolutions = lines
        .filter((line) => line.startsWith('* [Resolution'))
        // eslint-disable-next-line no-multi-spaces
        .map((line) => line.slice(2))                                      // remove the markdown list character
        .map((line) => {
            const split  = line.split('](');
            const number = split[0].substring("Resolution #".length + 1);
            const text   = split[1].replace(/#resolution[0-9]+\):/,'').trim();
            return {
                date,
                number : Number.parseInt(number),
                text,
                url    : `${url}#resolution${number}`,
            }
        });
    const retval = {
        year,
        resolutions
    };
    return retval;
}

/* -------------------------------------------------------------------------------- */
module.exports = { get_resolutions };

