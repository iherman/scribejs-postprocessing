/**
 * ## Utility functions
 * 
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/

import { MinuteProcessing } from './types';
import { DO_DEBUG, DO_LOG } from './config';


/**
 * Check whether the resolutions for minutes have already been handled in a previous run. Used to avoid unnecessary regeneration of data.
 * 
 * @param refs - Array of minute references (i.e., file names) 
 * @param current  - Array of current resolution data objects
 * @return - Array of minute references that must be handled
 */
export function filter_resolutions(refs: string[], current: MinuteProcessing): string[] {
    return refs.filter((ref) => {
        return !current.short_names.includes(ref);
    });
}


/**
 * Extract the schema.org data from the minutes' preamble, and turn it into a bona fide 
 * Javascript object.
 * 
 * @param lines - The minutes, broken into an array of individual strings
 */
export function get_schema(lines: string[]): any {
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
        for ( ; index < lines.length; index++) {
            if (lines[index].startsWith('---')) {
                break;
            } else {
                json_data = `${json_data}\n${lines[index]}`;
            }
        }
        return JSON.parse(json_data);
    } else {
        return null;
    }
}


/**
 * Print a debug statement if the [[DO_DEBUG]] flag is set to `true`.
 * 
 * @param preamble - "Preamble" text to be printed first 
 * @param obj - An object, converted to JSON before printed, together with the preamble. This value may be undefined, in which case only the preamble is printed.
 */
export function DEBUG(preamble: string, obj: any = undefined): void { 
    if (DO_DEBUG) {
        if (obj)
            console.error(`${preamble} ${JSON.stringify(obj)}`)
        else 
            console.error(`${preamble}`)
    }
}

/**
 * Print a log statement if the [[DO_LOG]] flag is set to `true`.
 * 
 * @param preamble - "Preamble" text to be printed first 
 * @param obj - An object, converted to JSON before printed, together with the preamble. This value may be undefined, in which case only the preamble is printed.
 */
export function LOG(preamble: string, obj: any = undefined): void { 
    if (DO_LOG) {
        if (obj)
            console.log(`---Scribejs post processing--- ${preamble} ${JSON.stringify(obj)}`)
        else 
            console.log(`---Scribejs post processing --- ${preamble}`)
    }
}
