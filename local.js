#!/usr/bin/env node
'use strict';

const MINUTE_LOCAL_REPOS = [
    {
        dir     : '/Users/ivan/W3C/github/Tools/scribejs-resolutions',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    }
]

const DEBUG            = false;
const LOG              = true;

/* ------------------------------------------------------------------------------------------------- */

const fs   = require('fs');
const fsp  = fs.promises;
const path = require('path');
const { filter_resolutions, collect_resolutions } = require('./lib/resolutions');

const debug = (preamble, obj = {}) => { 
    if (DEBUG) console.log(`${preamble}: ${JSON.stringify(obj, null, 4)}`);
};

const log   = (preamble, obj = undefined) => { 
    if (LOG) {
        if (obj)
            console.log(`---Scribejs resolutions--- ${preamble} ${JSON.stringify(obj)}`)
        else 
            console.log(`---Scribejs resolutions--- ${preamble}`)
    }
};


/**
 * The main processing: for each repo in [[minute_repos]] get the current list of resolution from the repo,
 * compare them to the list of minutes in the `_minutes` folder on the top of the repo, generate the missing 
 * set of resolutions, and return the updated list.
 */
async function main() {
    /* Used for debugging... */

    MINUTE_LOCAL_REPOS.forEach(async (local_repo) => {
        const now      = (new Date()).toISOString();
        const repo_log = local_repo.dir;
        try {
            log(`=== ${now}`);
            log('Updating', repo_log);
            const get_file = async (file_name) => fsp.readFile(file_name, 'utf-8');

            let current;
            try {
                const current_data    = await fsp.readFile(path.join(local_repo.dir, local_repo.current),'utf-8');
                current               = JSON.parse(current_data);    
            } catch(e) {
                current = {
                    short_names : [],
                    resolutions : []
                }
            }
            debug('Current assets', current); 

            const list_of_minutes = await fsp.readdir(path.join(local_repo.dir, '_minutes'), 'utf-8');
            debug('Current listing', list_of_minutes);

            const missing_files   = filter_resolutions(list_of_minutes, current);
            debug('To be used for new resolutions', missing_files);

            if (missing_files.length === 0) {
                log('No new minutes to process')
            } else {
                const new_resolutions = await collect_resolutions(
                    missing_files, 
                    (file_name) => fsp.readFile(
                                        path.join(local_repo.dir, local_repo.minutes, file_name),
                                        'utf-8'
                                    )
                );
                debug('New set of resolutions', new_resolutions);

                const new_asset       = {
                    date        : now,
                    short_names : [...current.short_names, ...new_resolutions.short_names],
                    resolutions : [...new_resolutions.resolutions, ...current.resolutions]
                }
                debug('New asset:', new_asset);

                console.log(JSON.stringify(new_asset,null,4));

                // await fsp.writeFile(path.join(local_repo.dir, local_repo.current), JSON.stringify(new_asset, null, 4), 'utf-8')
                log('Updated');
            }
        } catch(e) {
            log(`Problems: ${e} with`, repo_log)
        } finally {
            log('===')
        }
    });
}

// Let's go
main()
