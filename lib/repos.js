#!/usr/bin/env node
'use strict';

const fsp        = require('fs').promises;
const path       = require('path');

const { Github }                                                  = require('./githubapi');
const { filter_resolutions, collect_resolutions }                 = require('./resolutions');
const { USER_CONFIG_NAME, LOCAL_REPOS, GITHUB_REPOS, LOG, DEBUG } = require('./config');

/* ------------------------------------------------------------------------------------------------- */


/**
 * The main processing for github repositories: for each repo in {@link GITHUB_REPOS}:
 * 
 * 1. get the “current” list of resolution from the repo,
 * 2. compare them to the list of minutes in the folder marked to contain the minutes
 * 3. generate the missing set of resolutions by invoking {@link collect_resolutions} function on the list of minute references
 * 4. merge the results with the “current” list
 * 5. commit a new “current” list of resolution on the repo (making use of the user’s API)
 * 
 * Access to the github repository (i.e., step 5 above) is based on the user’s API token, stored in the local configuration file (see {@link USER_CONFIG_NAME})
 * 
 * @async
 */
async function github_repos() {
    let github_credentials = {};

    // Do what is necessary for a single github repository
    const handle_one_repo = async (repo) => {
        const now = (new Date()).toISOString();
        const repo_log = {owner : repo.owner, repo: repo.repo};
        try {
            LOG(`=== ${now} (run on github repos)`);
            LOG('Updating', repo_log);
            const the_repo = new Github(github_credentials.ghtoken, repo.owner, repo.repo)
            // const the_repo = (new Octokat({ token: github_credentials.ghtoken })).repos(repo.owner, repo.repo);

            // Get hold of the asset file to see what is there...
            let current_asset;
            let current_sha;
            try {
                const gh_data = await the_repo.get_json(repo.current);
                current_asset = gh_data.content;
                current_sha   = gh_data.sha;
            } catch(e) {
                current_asset = {
                    short_names : [],
                    resolutions : []
                }
                current_sha   = undefined;
            }
            DEBUG('Current assets', current_asset);  

            // Get hold of the list of minute files
            let missing_files   = [];
            let list_of_minutes = [];
            try {
                const list_of_minutes_wrappers = await the_repo.get_listing(repo.minutes, 400);
                list_of_minutes                = list_of_minutes_wrappers.items.map((item) => item.downloadUrl.split('/').pop());
                DEBUG('Current listing', list_of_minutes);
    
                // See if any new minutes have been added to the system since the last run
                missing_files = filter_resolutions(list_of_minutes, current_asset);
                DEBUG('To be used for new resolutions', missing_files);    
            } catch(e) {
                LOG('No minutes to process')
                return;
            }

            if (missing_files.length === 0) {
                LOG('No new minutes to process')
            } else {
                missing_files.forEach((fname) => LOG(`Processing ${fname}`));
                // Get the new resolutions, as well as the lists of minute files that are parsed
                const new_resolutions = await collect_resolutions(
                    missing_files, 
                    (file_name) => the_repo.get_file(repo.minutes, file_name)
                );
                
                const new_asset       = {
                    date        : now,
                    short_names : [...current_asset.short_names, ...new_resolutions.short_names],
                    resolutions : [...new_resolutions.resolutions, ...current_asset.resolutions]
                } 
                DEBUG('New asset:', new_asset);

                // Update/commit the new set of resolutions
                await the_repo.update(`Updated resolution list for ${now}`, new_asset, current_sha)
                LOG('Updated');
            }
        } catch(e) {
            LOG(`Problems: ${e} with`, repo_log)
        } finally {
            LOG('===')
        }
    };

    // Get hold of the github credentials
    try {
        const fname          = path.join(process.env.HOME, USER_CONFIG_NAME);
        const config_content = await fsp.readFile(fname, 'utf-8');
        github_credentials   = JSON.parse(config_content);
    } catch(e) {
        console.log(`Could not get hold of the github credentials: ${e}`);
        process.exit(-1);
    }
    DEBUG('Credentials:', github_credentials);

    // It is necessary to do it this way to ensure a non-overlapping set of logs
    for (let i = 0; i < GITHUB_REPOS.length; i++) {
        await handle_one_repo(GITHUB_REPOS[i]);
    }
}


/* ------------------------------------------------------------------------------------------------- */

/**
 * The main processing for local repositories: for each repo in {@link LOCAL_REPOS}:
 * 
 * 1. get the “current” list of resolution from the local repo,
 * 2. compare them to the list of minutes in the folder marked to contain the minutes
 * 3. generate the missing set of resolutions by invoking {@link collect_resolutions} function on the list of minute references
 * 4. merge the results with the “current” list
 * 5. overwrite the “current” list of resolution with the new content
 * 
 * @async
 */
async function local_repos() {
    const handle_one_repo = async (local_repo) => {
        const now      = (new Date()).toISOString();
        const repo_log = local_repo.dir;
        try {
            LOG(`=== ${now} (run on local repos)`);
            LOG('Updating', repo_log);
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
            DEBUG('Current assets', current); 

            const list_of_minutes = await fsp.readdir(path.join(local_repo.dir, '_minutes'), 'utf-8');
            DEBUG('Current listing', list_of_minutes);

            const missing_files   = filter_resolutions(list_of_minutes, current);
            DEBUG('To be used for new resolutions', missing_files);

            if (missing_files.length === 0) {
                LOG('No new minutes to process')
            } else {
                missing_files.forEach((fname) => LOG(`Processing ${fname}`));
                const new_resolutions = await collect_resolutions(
                    missing_files, 
                    (file_name) => fsp.readFile(
                                        path.join(local_repo.dir, local_repo.minutes, file_name),
                                        'utf-8'
                                    )
                );
                DEBUG('New set of resolutions', new_resolutions);

                const new_asset       = {
                    date        : now,
                    short_names : [...current.short_names, ...new_resolutions.short_names],
                    resolutions : [...new_resolutions.resolutions, ...current.resolutions]
                }
                DEBUG('New asset:', new_asset);

                await fsp.writeFile(path.join(local_repo.dir, local_repo.current), JSON.stringify(new_asset, null, 4), 'utf-8')
                LOG('Updated');
            }
        } catch(e) {
            LOG(`Problems: ${e} with`, repo_log)
        } finally {
            LOG('===')
        }
    };

    // It is necessary to do it this way to ensure a non-overlapping set of logs
    for (let i = 0; i < LOCAL_REPOS.length; i++) {
        await handle_one_repo(LOCAL_REPOS[i]);
    }
    
}

/* ------------------------------------------------------------------------------------------------- */

module.exports = { local_repos, github_repos };
