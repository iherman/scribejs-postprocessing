#!/usr/bin/env node
'use strict';

const MINUTE_REPOS = [
    {
        owner   : 'iherman',
        repo    : 'scribejs-resolutions',
        minutes : '_minutes',
        current : 'assets/resolutions.json'
    }
]

const DEBUG            = true;
const USER_CONFIG_NAME = ".ghid.json";
const ASSET_NAME       = 'assets/resolutions.json';


/* ------------------------------------------------------------------------------------------------- */

const fs      = require('fs');
const fsp     = fs.promises;
const path    = require('path');
const Octokat = require('octokat');
const { filter_resolutions, collect_resolutions } = require('./lib/resolutions');


/**
 * The main processing: for each repo in [[minute_repos]] get the current list of resolution from the repo,
 * compare them to the list of minutes in the `_minutes` folder on the top of the repo, generate the missing 
 * set of resolutions, and return the updated list.
 */
async function main() {
    /* Used for debugging... */
    const print = (preamble, obj) => console.log(`${preamble}: ${JSON.stringify(obj, null, 4)}`);
    const base64_to_string = (data) => Buffer.from(data,'base64').toString('utf-8');

    //1. Get hold of the github credential
    let github_credentials = {};
    try {
        const fname          = path.join(process.env.HOME, USER_CONFIG_NAME);
        const config_content = await fsp.readFile(fname, 'utf-8');
        github_credentials   = JSON.parse(config_content);
    } catch(e) {
        console.log(`Could not get hold of the github credentials: ${e}`);
        process.exit(-1);
    }
    // if (DEBUG) print('Credentials:', github_credentials);

    // Do what is necessary for each github repositories
    MINUTE_REPOS.forEach(async (repo) => {
        try {
            // if (DEBUG) print('Repo: ', repo);
            const the_repo = (new Octokat({ token: github_credentials.ghtoken })).repos(repo.owner, repo.repo);

            // Get hold of the asset file to see what is there...
            let current;
            try {
                const current_assets_wrapper = await the_repo.contents(repo.current).fetch();
                current                      = JSON.parse(base64_to_string(current_assets_wrapper.content));    
            } catch(e) {
                current = {
                    short_names : [],
                    resolutions : []
                }        
            }
            // if (DEBUG) print('Current assets', current);  

            // Get hold of the list of minute files
            const list_of_minutes_wrappers = await the_repo.contents(repo.minutes).fetch({ per_page: 400 });
            const list_of_minutes          = list_of_minutes_wrappers.items.map((item) => item.downloadUrl.split('/').pop());
            // if (DEBUG) print('Current listing', list_of_minutes);

            const missing_files = filter_resolutions(list_of_minutes, current);
            // if (DEBUG) print('To be used for new resolutions', missing_files);

            const new_resolutions = await collect_resolutions(missing_files, (file_name) => 
                the_repo.contents(repo.minutes, file_name).read()
            );
            // if (DEBUG) print('New set of resolutions', new_resolutions);

            const new_asset       = {
                short_names : [...current.short_names, ...new_resolutions.short_names],
                resolutions : [...new_resolutions.resolutions, ...current.resolutions]
            } 
            if (DEBUG) print('New asset', new_asset);
            
        } catch(e) {
            console.log(`Problems with repo ${repo}: ${e}`)
        }
    });
}



// Let's go
main();
