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

const DEBUG            = false;
const LOG              = true;
const USER_CONFIG_NAME = ".ghid.json";


/* ------------------------------------------------------------------------------------------------- */

const fs      = require('fs');
const fsp     = fs.promises;
const path    = require('path');
const Octokat = require('octokat');
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

const base64_to_string = (data) => Buffer.from(data,'base64').toString('utf-8');
const string_to_base64 = (string) => Buffer.from(string).toString('base64');

/**
 * The main processing: for each repo in [[minute_repos]] get the current list of resolution from the repo,
 * compare them to the list of minutes in the `_minutes` folder on the top of the repo, generate the missing 
 * set of resolutions, and return the updated list.
 */
async function main() {
    // Get hold of the github credentials
    let github_credentials = {};
    try {
        const fname          = path.join(process.env.HOME, USER_CONFIG_NAME);
        const config_content = await fsp.readFile(fname, 'utf-8');
        github_credentials   = JSON.parse(config_content);
    } catch(e) {
        console.log(`Could not get hold of the github credentials: ${e}`);
        process.exit(-1);
    }
    debug('Credentials:', github_credentials);

    // Do what is necessary for each github repositories
    MINUTE_REPOS.forEach(async (repo) => {
        const now = (new Date()).toISOString();
        const repo_log = {owner : repo.owner, repo: repo.repo};
        try {
            log(`=== ${now}`);
            log('Updating', repo_log);
            const the_repo = (new Octokat({ token: github_credentials.ghtoken })).repos(repo.owner, repo.repo);

            // Get hold of the asset file to see what is there...
            let current_asset;
            let current_sha;
            try {
                const current_gh_data = await the_repo.contents(repo.current).fetch();
                current_asset         = JSON.parse(base64_to_string(current_gh_data.content));
                current_sha           = current_gh_data.sha;    
            } catch(e) {
                current_asset = {
                    short_names : [],
                    resolutions : []
                }
                current_sha   = undefined;
            }
            debug('Current assets', current_asset);  

            // Get hold of the list of minute files
            const list_of_minutes_wrappers = await the_repo.contents(repo.minutes).fetch({ per_page: 400 });
            const list_of_minutes          = list_of_minutes_wrappers.items.map((item) => item.downloadUrl.split('/').pop());
            debug('Current listing', list_of_minutes);

            // See if any new minutes have been added to the system since the last run
            const missing_files = filter_resolutions(list_of_minutes, current_asset);
            debug('To be used for new resolutions', missing_files);

            if (missing_files.length === 0) {
                log('No new minutes to process')
            } else {
                // Get the new resolutions, as well as the lists of minute files that are parsed
                const new_resolutions = await collect_resolutions(
                    missing_files, 
                    (file_name) => the_repo.contents(repo.minutes, file_name).read()
                );
                
                const new_asset       = {
                    date        : now,
                    short_names : [...current_asset.short_names, ...new_resolutions.short_names],
                    resolutions : [...new_resolutions.resolutions, ...current_asset.resolutions]
                } 
                debug('New asset:', new_asset);

                // Update/commit the new set of resolutions
                const new_gh_data = {
                    message: `Updated resolution list for ${now}`,
                    content: string_to_base64(JSON.stringify(new_asset,null,4))
                }
                if (current_sha !== undefined) new_gh_data.sha = current_sha;
                await the_repo.contents(repo.current).add(new_gh_data);
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
main();
