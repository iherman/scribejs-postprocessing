'use strict';

const LOCAL_REPOS = [
    {
        dir     : '/Users/ivan/W3C/github/Tools/scribejs-resolutions',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    }
]

const GITHUB_REPOS = [
    {
        owner   : 'iherman',
        repo    : 'scribejs-resolutions',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    }
]

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
