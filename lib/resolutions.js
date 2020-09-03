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

const { LOG, DEBUG } = require('./config');

const url_regexp = /^\s*"url"\s*:\s*"([a-z:\-#@.\/0-9A-Z]*)/;
// This one relies on the data in the JSON-LD header part
// const date_regexp = /^\s*"dateCreated"\s*:\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})/;

// This one relies on the date statement in the markdown itself.
// Better use this: if the date is not set properly in the IRC log, this value is still set
const date_regexp = /^\s*\*\*Date:\*\*\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/;

/**
 * Compare resolution objects; to be used in a “sort” method on array of objects.
 * 
 * Sorting takes a decreasing order by year, a decreasing order by meeting date within a year, and finally an increasing order by resolution number
 *  
 * @param {Object} a 
 * @param {Object} b
 * @returns {Number} - negative, zero, or positive, depending on the comparison result (see the Javascript “sort” method for details) 
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
 * @param {String[]} refs - Array of minute references (i.e., file names) 
 * @param {Object[]} current  - Array of current resolution data objects
 * @return {String[]} - Array of minute references that must be handled
 */
function filter_resolutions(refs, current) {
    return refs.filter((ref) => {
        return !current.short_names.includes(ref);
    });
}


/**
 * Get the resolution for a minute text (in markdown). The function relies upon the scribejs format. It:
 *
 * * extracts the URL and the date of the minutes from the preambles in JSON-LD
 * * extracts the resolution summary lines
 * * creates an array of resolution object, with the following keys: `year`, `date`, `number` (i.e., index of the resolution for one call), `text` (for the text of
 * the resolution) and the `url` into the relevant minutes. 
  *
 * @param {String} minutes - the minutes for a call, in markdown
 * @returns {Object[]} - resolution data for one call
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

/**
 * 
 * Collect all the resolutions. The function calls out, for each minute file, to the {@link get_resolutions} functions,
 * and flattens all resolutions into a single large resolution. The set of resolution is also sorted (using {@link sort_resolutions}).
 * 
 * @param {String[]} file_names - List of the minute file names, i.e., the base name of the minute file in its repository
 * @param {Function} get_data - A function returning the markdown content of the minutes in a Promise. The function itself either uses the local file system read or a fetch to the repository, depending on whether this function is called from {@link local_repos} or {@link github_repos}, respectively.
 * @returns {Promise<Object>} - Object consisting of two fields: the content of `file_names` (with the key `short_names`) and the list of all the (new) resolutions (with the key `resolutions`) 
 * 
 * @async
 */
async function collect_resolutions(file_names, get_data) {
    const minutes_promises = file_names.map((file_name) => get_data(file_name));
    const minutes          = await Promise.all(minutes_promises);
    const resolutions      = minutes
        // extract all resolutions from the markdown text, returning an array of resolution objects
        .map(get_resolutions)
        // add the group name to each resolution, based on the file name
        .map((res_array, index) => {
            // extract the group name from the file short name
            const call = file_names[index].split('.')[0].slice(11)
            return res_array.map((resolution) => {
                resolution.call = call;
                return resolution;
            });
        })
        // turn array of arrays into a single array
        .reduce((accumulator, currentValue) => [...accumulator, ...currentValue],[])
        // sort the resolution.
        .sort(sort_resolutions);

    return {
        short_names : file_names,
        resolutions,
    }
}

/* -------------------------------------------------------------------------------- */
module.exports = { filter_resolutions, collect_resolutions };

