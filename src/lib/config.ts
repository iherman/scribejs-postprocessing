
/**
 * ## Configuration settings
 *
 * @packageDocumentation
*/

import {Local_Repo, Github_Repo} from './types';

/**
 * List of local repos to process when running the {@link local_repos} function: each object has a field for the directory (`dir`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
// export const LOCAL_REPOS: Local_Repo[] = [
//     {
//         dir           : '/Users/ivan/W3C/github/DID/did-wg',
//         minutes       : '_minutes',
//         current       : 'assets/resolutions.json',
//         handle_issues : false,
//     },
//     {
//         dir           : '/Users/ivan/W3C/github/EPUB/epub-wg',
//         minutes       : '_minutes',
//         current       : 'assets/resolutions.json',
//         handle_issues : false,
//     },
// ]

export const LOCAL_REPOS: Local_Repo[] = [
    {
        dir           : '/Users/ivan/W3C/github/Tools/mprocessing_tests',
        minutes       : '_minutes',
        current       : 'assets/minute_processing.json',
        handle_issues : true,
    },
]


/**
 * List of github repos to process when running the {@link github_repos} function: each object has a field for the repository (`owner` and `repo`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
// export const GITHUB_REPOS: Github_Repo[] = [
//     {
//         owner         : 'w3c',
//         repo          : 'did-wg',
//         minutes       : '_minutes',
//         current       : 'assets/resolutions.json',
//         handle_issues : true,
//     },
//     {
//         owner         : 'w3c',
//         repo          : 'epub-wg',
//         minutes       : '_minutes',
//         current       : 'assets/resolutions.json',
//         handle_issues : true,
//     },
// ]

export const GITHUB_REPOS: Github_Repo[] = [
    {
        owner         : 'iherman',
        repo          : 'mprocessing_tests',
        minutes       : '_minutes',
        current       : 'assets/minute_processing.json',
        handle_issues : true,
    },
]


/**
 * The name of the configuration file in the user’s home directory. It contains the user’s github API token (`ghtoken`), 
 * necessary for committing the results on the github repository.
 */
export const USER_CONFIG_NAME = ".ghid.json";

/** @internal */
export const DO_DEBUG  = false;

/** @internal */
export const DO_LOG    = true;

/* ------------------------------------------------------------------------------------------------- */

