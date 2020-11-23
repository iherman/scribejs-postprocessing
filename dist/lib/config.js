"use strict";
/**
 * ## Configuration settings
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DO_UPDATE = exports.DO_LOG = exports.DO_DEBUG = exports.USER_CONFIG_NAME = exports.GITHUB_REPOS = exports.LOCAL_REPOS = void 0;
/**
 * List of local repos to process when running the {@link local_repos} function: each object has a field for the directory (`dir`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
exports.LOCAL_REPOS = [
    {
        dir: '/Users/ivan/W3C/github/DID/did-wg',
        minutes: '_minutes',
        current: 'assets/minute_processing.json',
        handle_issues: false,
    },
    {
        dir: '/Users/ivan/W3C/github/EPUB/epub-wg',
        minutes: '_minutes',
        current: 'assets/minute_processing.json',
        handle_issues: false,
    },
];
// export const LOCAL_REPOS: LocalRepo[] = [
//     {
//         dir           : '/Users/ivan/W3C/github/Tools/mprocessing_tests',
//         minutes       : '_minutes',
//         current       : 'assets/minute_processing.json',
//         handle_issues : true,
//     },
// ]
/**
 * List of github repos to process when running the {@link github_repos} function: each object has a field for the repository (`owner` and `repo`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
exports.GITHUB_REPOS = [
    {
        owner: 'w3c',
        repo: 'did-wg',
        minutes: '_minutes',
        current: 'assets/minute_processing.json',
        handle_issues: true,
    },
    {
        owner: 'w3c',
        repo: 'epub-wg',
        minutes: '_minutes',
        current: 'assets/minute_processing.json',
        handle_issues: true,
    },
];
// export const GITHUB_REPOS: GithubRepo[] = [
//     {
//         owner         : 'iherman',
//         repo          : 'mprocessing_tests',
//         minutes       : '_minutes',
//         current       : 'assets/minute_processing.json',
//         handle_issues : true,
//     },
// ]
/**
 * The name of the configuration file in the user’s home directory. It contains the user’s github API token (`ghtoken`),
 * necessary for committing the results on the github repository.
 */
exports.USER_CONFIG_NAME = ".ghid.json";
/** @internal */
exports.DO_DEBUG = false;
/** @internal */
exports.DO_LOG = true;
/** @internal */
exports.DO_UPDATE = true;
/* ------------------------------------------------------------------------------------------------- */
//# sourceMappingURL=config.js.map