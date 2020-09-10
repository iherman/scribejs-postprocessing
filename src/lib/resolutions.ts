
/**
 * ## Gathering the resolutions
 * 
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/

import { Resolution, Resolutions, GetDataCallback } from './types';
import { DEBUG } from './config';

import * as showdown from 'showdown';
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
function sort_resolutions(a: Resolution,b: Resolution): number {
    if (a.year === b.year) {
        if (a.date === b.date) {
            return a.number - b.number;
        } else if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    } else {
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
export function filter_resolutions(refs: string[], current: Resolutions): string[] {
    return refs.filter((ref) => {
        return !current.short_names.includes(ref);
    });
}


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
function get_resolutions(minutes: string): Resolution[] {
    const get_match = (line: string, regexp: RegExp): string => {
        const result = line.match(regexp);
        return (result === null) ? undefined : result[1];
    };

    const find_match = (lines: string[], regexp: RegExp): string => {
        for (let i = 0; i < lines.length; i++) {
            const url = get_match(lines[i], regexp);
            if (url) {
                return url;
            }
        }
        return undefined;
    };

    try {
        const lines: string[] = minutes.split('\n');
        const url: string     = find_match(lines, url_regexp);
        const date: string    = find_match(lines, date_regexp);
        if (date === undefined) {
            DEBUG(`For some reasons the date is missing in ${minutes}`)
            return [];
        }
        const year: string = date.split('-')[0];
        // eslint-disable-next-line no-multi-spaces
        const resolutions = lines
            .filter((line: string): boolean => line.startsWith('* [Resolution'))
            .map((line:string ): string => line.slice(2))  // remove the markdown list character
            .map((line: string): Resolution => {
                const number: string = line.split('](')[0].substring("Resolution #".length + 1);
                const text: string   = line.replace(/\[Resolution #[0-9]+\]\(#resolution[0-9]+\):/, '').trim();
                return {
                    year   : Number.parseInt(year),
                    date,
                    number : Number.parseInt(number),
                    text   : converter.makeHtml(text).replace('<p>','').replace('</p>',''), // the converter puts the text into a paragraph, hence the replace... 
                    url    : `${url}#resolution${number}`,
                    call   : ''  // to be set in in the callee of this function!
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
 * Collect all the resolutions. The function calls out, for each minute file, to the [[get_resolutions]] function,
 * and flattens all such resolutions into a single large resolution. The set of resolution is also sorted (using [[sort_resolutions]]).
 * 
 * @param file_names - List of the minute file names, i.e., the base name of the minute file in its repository
 * @param get_data - A function returning the markdown content of the minutes in a Promise. The function itself either uses the local file system read or a fetch to the repository, depending on whether this function is called from [[local_repos]] or [[github_repos]], respectively.
 * @returns  - List of resolutions 
 * 
 * @async
 */
export async function collect_resolutions(file_names: string[], get_data: GetDataCallback): Promise<Resolutions> {
    const minutes_promises: Promise<string>[] = file_names.map((file_name) => get_data(file_name));
    const minutes: string[]                   = await Promise.all(minutes_promises);
    const resolutions      = minutes
        // extract all resolutions from the markdown text, returning an array of resolution objects
        .map(get_resolutions)
        // add the group name to each resolution, based on the file name
        .map((res_array: Resolution[], index: number): Resolution[] => {
            // extract the group name from the file short name
            const call = file_names[index].split('.')[0].slice(11)
            return res_array.map((resolution: Resolution): Resolution => {
                resolution.call = call;
                return resolution;
            });
        })
        // turn array of arrays into a single array
        .reduce((accumulator: Resolution[], currentValue: Resolution[]): Resolution[] => [...accumulator, ...currentValue],[])
        // sort the resolution.
        .sort(sort_resolutions);

    return {
        short_names : file_names,
        resolutions,
    }
}

