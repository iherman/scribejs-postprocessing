'use strict';

/**
 * List of local repos to process when running the {@link local_repos} function: each object has a field for the directory (`dir`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
const LOCAL_REPOS = [
    {
        dir     : '/Users/ivan/W3C/github/DID/did-wg',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    },
    {
        dir     : '/Users/ivan/W3C/github/EPUB/epub-wg',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    }
]

/**
 * List of github repos to process when running the {@link github_repos} function: each object has a field for the repository (`owner` and `repo`), the folder used for the minutes themselves (`minutes`) and the reference to the current resolution file (`current`).
 */
const GITHUB_REPOS = [
    {
        owner   : 'w3c',
        repo    : 'did-wg',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    },
    {
        owner   : 'w3c',
        repo    : 'epub-wg',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    }
]

/**
 * The name of the configuration file in the user’s home directory. It contains the user’s github API token (`ghtoken`), 
 * necessary for committing the results on the github repository.
 */
const USER_CONFIG_NAME = ".ghid.json";

const DO_DEBUG  = false;
const DO_LOG    = true;


function DEBUG(preamble, obj = {}) { 
    if (DO_DEBUG) console.log(`${preamble}: ${JSON.stringify(obj, null, 4)}`);
};

function LOG(preamble, obj = undefined) { 
    if (DO_LOG) {
        if (obj)
            console.log(`---Scribejs resolutions--- ${preamble} ${JSON.stringify(obj)}`)
        else 
            console.log(`---Scribejs resolutions--- ${preamble}`)
    }
};

/* ------------------------------------------------------------------------------------------------- */

module.exports = {USER_CONFIG_NAME, LOCAL_REPOS, GITHUB_REPOS, LOG, DEBUG}
