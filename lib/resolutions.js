'use strict';

const showdown = require('showdown');
const converter = new showdown.Converter({
    omitExtraWLInCodeBlocks            : true,
    simplifiedAutoLink                 : true,
    excludeTrailingPunctuationFromURLs : true,
    literalMidWordUnderscores          : true,
    literalMidWordAsterisks            : true,
    strikethrough                      : true,
    ghMentions                         : true,

});
converter.setFlavor('github');

const url_regexp = /^\s*"url"\s*:\s*"([a-z:\-#@.\/0-9A-Z]*)/;
// This one relies on the data in the JSON-LD header part
// const date_regexp = /^\s*"dateCreated"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})/;

// This one relies on the date statement in the markdown itself.
const date_regexp = /^\s*\*\*Date:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/;

/**
 * Compare resolution objects; to be used in a sort method on array of objects.
 * 
 * Sorting takes a decreasing order by year, then a decreasing order by meeting date and then an increasing order by resolution number
 *  
 * @param {Object} a 
 * @param {Object} b 
 */
function sort_resolutions(a,b) {
    if (a.year === b.year) {
        if (a.date === b.date) {
            return a.number - b.number;
        } else {
            if (a.date < b.date) {
                return 1;
            } else if (a.date > b.date) {
                return -1;
            } 
        }
    } else {
        return b.year - a.year;
    }
}


/**
 * Check whether the resolutions for minutes have already been handled in a previous run. Used to avoid unnecessary regeneration of data.
 * 
 * @param {Array} refs - Array of minute references (URL-s or file names) 
 * @param {*} current  - Array of current resolution data objects
 * @return {Array} - Array of minute references that must be handled
 */
function filter_resolutions(refs, current) {
    return refs.filter((ref) => {
        const shortname = ref.split('/').pop();
        return !current.short_names.includes(shortname);
    });
}


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
    try {
        const lines = minutes.split('\n');
        const url  = find_match(lines, url_regexp);
        const date = find_match(lines, date_regexp);
        if (date === undefined) {
            console.error(`For some reasons the date is missing in ${minutes}`)
            return [];
        }
        const year = date.split('-')[0];
        // eslint-disable-next-line no-multi-spaces
        const resolutions = lines
            .filter((line) => line.startsWith('* [Resolution'))
            .map((line) => line.slice(2))  // remove the markdown list character
            .map((line) => {
                const number = line.split('](')[0].substring("Resolution #".length + 1);
                const text   = line.replace(/\[Resolution #[0-9]+\]\(#resolution[0-9]+\):/, '').trim();
                return {
                    year   : Number.parseInt(year),
                    date,
                    number : Number.parseInt(number),
                    text   : converter.makeHtml(text).replace('<p>','').replace('</p>',''),  // the converter puts the text into a paragraph...
                    url    : `${url}#resolution${number}`,
                }
            });
        return resolutions;    
    } catch(e) {
        console.error(`${e}`);
        return [];
    }
}

/* -------------------------------------------------------------------------------- */
module.exports = { get_resolutions, sort_resolutions, filter_resolutions };

