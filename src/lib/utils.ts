/**
 * ## Utility functions
 * 
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/

import { MinuteProcessing, Credentials } from './types';
import { DO_DEBUG, DO_LOG } from './config';
import { Github }           from './js/githubapi';


/**
 * Check whether the resolutions for minutes have already been handled in a previous run. Used to avoid unnecessary regeneration of data.
 * 
 * @param refs - Array of minute references (i.e., file names) 
 * @param current  - Array of current resolution data objects
 * @return - Array of minute references that must be handled
 */
export function filter_resolutions(refs: string[], current: MinuteProcessing): string[] {
    try {
        return refs.filter((ref) => {
            return !current.file_names.includes(ref);
        });
    } catch {
        return refs;
    } 
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

/** @internal */
interface gh_cache {
    [key:string]: Github
}

/**
 * Caching the existing github access objects, using the 'owner/repo' values as key
 * in the cache. (It is not necessary to create a new instance of such an object
 * for every occurrence of a comment...)
 */
export class GithubCache {
    private gh_token: string;
    private values: gh_cache = {};

    /**
     * 
     * @param gh_credentials - the user's necessary credential data. Only the OAUth token is used.
     */
    constructor(gh_credentials: Credentials) {
        this.gh_token = gh_credentials.ghtoken;
    }

    /**
     * Return a [[Github]] object to access the repository via the Github API. If this object has already been created it will return it; if not, it will be created first and stored.
     * 
     * @param owner - github repository owner
     * @param repo - github repository name
     */
    gh(owner: string, repo: string): Github {
        const key = `${owner}/${repo}`;
        if (this.values[key] === undefined) {
            this.values[key] = new Github(this.gh_token, owner, repo);
        }
        return this.values[key];
    }
}


/**
 * Helper function to "flatten" arrays of arrays into a single array. This method should be used as the callback
 * for a `reduce`.
 *   
 * @param accumulator - Accumulated array in a reduce
 * @param currentValue - The next array to be considered
 */
export function flatten<T>(accumulator: T[], currentValue: T[]): T[] {
    return [...accumulator, ...currentValue];
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
            console.log(`--- Scribejs post processing --- ${preamble} ${JSON.stringify(obj)}`)
        else 
            console.log(`--- Scribejs post processing --- ${preamble}`)
    }
}
