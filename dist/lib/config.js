"use strict";
/**
 * ## Configuration options, and common logging/debugging tools
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG = exports.DEBUG = exports.USER_CONFIG_NAME = exports.GITHUB_REPOS = exports.LOCAL_REPOS = void 0;
/**
 * List of local repos to process when running the {@link local_repos} function: each object has a field for the directory (`dir`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
exports.LOCAL_REPOS = [
    {
        dir: '/Users/ivan/W3C/github/DID/did-wg',
        minutes: '_minutes',
        current: 'assets/resolutions.json',
    },
    {
        dir: '/Users/ivan/W3C/github/EPUB/epub-wg',
        minutes: '_minutes',
        current: 'assets/resolutions.json',
    },
];
// export const LOCAL_REPOS: Local_Repo[] = [
//     {
//         dir     : '/Users/ivan/W3C/github/Tools/scribejs-resolutions',
//         minutes : '_minutes',
//         current : 'assets/resolutions.json'
//     }
// ]
/**
 * List of github repos to process when running the {@link github_repos} function: each object has a field for the repository (`owner` and `repo`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
exports.GITHUB_REPOS = [
    {
        owner: 'w3c',
        repo: 'did-wg',
        minutes: '_minutes',
        current: 'assets/resolutions.json',
    },
    {
        owner: 'w3c',
        repo: 'epub-wg',
        minutes: '_minutes',
        current: 'assets/resolutions.json',
    },
];
/**
 * The name of the configuration file in the user’s home directory. It contains the user’s github API token (`ghtoken`),
 * necessary for committing the results on the github repository.
 */
exports.USER_CONFIG_NAME = ".ghid.json";
const DO_DEBUG = false;
const DO_LOG = true;
/**
 * Print a debug statement if the [[DO_DEBUG]] flag is set to `true`.
 *
 * @param preamble - "Preamble" text to be printed first
 * @param obj - An object, converted to JSON before printed, together with the preamble. This value may be undefined, in which case only the preamble is printed.
 */
function DEBUG(preamble, obj = undefined) {
    if (DO_DEBUG) {
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
    if (DO_LOG) {
        if (obj)
            console.log(`---Scribejs resolutions--- ${preamble} ${JSON.stringify(obj)}`);
        else
            console.log(`---Scribejs resolutions--- ${preamble}`);
    }
}
exports.LOG = LOG;
/* ------------------------------------------------------------------------------------------------- */
//# sourceMappingURL=config.js.map