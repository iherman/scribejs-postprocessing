"use strict";
/**
 * ## Utility functions
 *
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG = exports.DEBUG = exports.flatten = exports.GithubCache = exports.get_schema = exports.filter_resolutions = exports.get_credentials = exports.json_conf_file = exports.today = void 0;
const config_1 = require("./config");
const githubapi_1 = require("./js/githubapi");
const path = require("path");
const node_fetch = require("node-fetch");
/** @internal */
const fetch = node_fetch.default;
const fs = require("fs");
/** @internal */
const fsp = fs.promises;
/** (Calculated) constant for today's date in ISO format */
exports.today = new Date().toISOString().split('T')[0];
/**
* Read a configuration file and generate the final combination.
*
* The full configuration file may have optional parts for extra calls and may also be used to refer to "local" (as opposed to be on the Web) versions
* of such files like the nickname collection. The function access the full configuration file and generates a version based on the core values, possibly modified
* by the information in the optional parts.
*
* @param file_name - file name
* @param local - whether certain files are to be extracted from the local repository (as opposed to be retrieved from github)
* @param group - group name (necessary if the call is an extra call rather than the 'base' one)
* @returns the parsed JSON content
* @throws - not-found error
*/
async function json_conf_file(file_name, local, group = undefined) {
    const get_config = async (name, is_local) => {
        if (is_local) {
            const data = await fsp.readFile(name, 'utf-8');
            return JSON.parse(data);
        }
        else {
            return await fetch(name).then((res) => res.json());
        }
    };
    try {
        // Get hold of the (full) configuration file
        let js_conf = await get_config(file_name, local);
        if (local && js_conf.local) {
            js_conf = { ...js_conf, ...js_conf.local };
        }
        if (js_conf.extra_calls && js_conf.extra_calls[group]) {
            js_conf = { ...js_conf, ...js_conf.extra_calls[group] };
        }
        // Clean the result to avoid confusion with debugging later:
        if (js_conf.extra_calls)
            delete js_conf.extra_calls;
        if (js_conf.local)
            delete js_conf.local;
        // This flag is need for processing further
        js_conf.is_local = local;
        return js_conf;
    }
    catch (e) {
        throw new Error(`Problem with the configuration file: ${file_name} (${e})!`);
    }
}
exports.json_conf_file = json_conf_file;
/**
 *
 * Get the credential structure from the local file system (ie, github id, SMTP data, etc)
 */
async function get_credentials() {
    try {
        const fname = path.join(process.env.HOME, config_1.USER_CONFIG_NAME);
        const config_content = await fsp.readFile(fname, 'utf-8');
        return JSON.parse(config_content);
    }
    catch (e) {
        throw new Error(`Could not get hold of the github credentials: ${e}`);
    }
}
exports.get_credentials = get_credentials;
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
 * Caching the existing github access objects, using the 'owner/repo' values as key
 * in the cache. (It is not necessary to create a new instance of such an object
 * for every occurrence of a comment...)
 */
class GithubCache {
    /**
     *
     * @param gh_credentials - the user's necessary credential data. Only the OAUth token is used.
     */
    constructor(gh_credentials) {
        this.values = {};
        this.gh_token = gh_credentials.ghtoken;
    }
    /**
     * Return a [[Github]] object to access the repository via the Github API. If this object has already been created it will return it; if not, it will be created first and stored.
     *
     * @param owner - github repository owner
     * @param repo - github repository name
     */
    gh(owner, repo) {
        const key = `${owner}/${repo}`;
        if (this.values[key] === undefined) {
            this.values[key] = new githubapi_1.Github(this.gh_token, owner, repo);
        }
        return this.values[key];
    }
}
exports.GithubCache = GithubCache;
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