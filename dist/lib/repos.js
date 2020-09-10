"use strict";
/**
 * ## Handling repositories.
 *
 * The module handles each repository, by collecting the resolutions for all (new) minutes and update resolution file for each.
 *
 * The module has two entry points:
 *
 * 1. [[github_repos]] to handle repositories directly from GitHub
 * 2. [[local_repos]] to handle locally cloned repositories
 *
 * The data about the repositories to be updated are defined in [[GITHUB_REPOS]] and [[LOCAL_REPOS]], respectively.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.local_repos = exports.github_repos = void 0;
const path = require("path");
const fs = require("fs");
/** @internal */
const fsp = fs.promises;
const githubapi_1 = require("./js/githubapi");
const config_1 = require("./config");
const resolutions_1 = require("./resolutions");
/* ------------------------------------------------------------------------------------------------- */
/**
 * The main processing for github repositories: for each repo in [[GITHUB_REPOS]]:
 *
 * 1. get the “current” list of resolution from the repo,
 * 2. compare them to the list of minutes in the folder marked to contain the minutes
 * 3. generate the missing set of resolutions by invoking [[collect_resolutions]] function on the list of minute references
 * 4. merge the results with the “current” list
 * 5. commit a new “current” list of resolution on the repo (making use of the user’s API token)
 *
 * Access to the github repository (i.e., step 5 above) is based on the user’s API token, stored in the local configuration file (see [[USER_CONFIG_NAME]])
 *
 * @async
 */
async function github_repos() {
    let github_credentials = {};
    // Do what is necessary for a single github repository
    const handle_one_repo = async (repo) => {
        // Note that the JSON based structures returned from the Github API are all typed as "any". It would be
        // nice if a proper Typescript definition was available for those but, alas!, I did not see any and
        // I did not define them
        const now = (new Date()).toISOString();
        const repo_log = { owner: repo.owner, repo: repo.repo };
        try {
            config_1.LOG(`=== ${now} (run on github repos)`);
            config_1.LOG('Updating', repo_log);
            const the_repo = new githubapi_1.Github(github_credentials.ghtoken, repo.owner, repo.repo);
            // Get hold of the asset file to see what is there...
            let current_asset;
            let current_sha;
            try {
                const gh_data = await the_repo.get_json(repo.current);
                current_asset = gh_data.content;
                current_sha = gh_data.sha;
            }
            catch (e) {
                current_asset = {
                    short_names: [],
                    resolutions: []
                };
                current_sha = undefined;
            }
            config_1.DEBUG('Current assets', current_asset);
            // Get hold of the list of minute files
            let missing_files = [];
            let list_of_minutes = [];
            try {
                const list_of_minutes_wrappers = await the_repo.get_listing(repo.minutes, 400);
                list_of_minutes = list_of_minutes_wrappers.items.map((item) => item.downloadUrl.split('/').pop());
                config_1.DEBUG('Current listing', list_of_minutes);
                // See if any new minutes have been added to the system since the last run
                missing_files = resolutions_1.filter_resolutions(list_of_minutes, current_asset);
                config_1.DEBUG('To be used for new resolutions', missing_files);
            }
            catch (e) {
                config_1.LOG('No minutes to process');
                return;
            }
            if (missing_files.length === 0) {
                config_1.LOG('No new minutes to process');
            }
            else {
                missing_files.forEach((fname) => config_1.LOG(`Processing ${fname}`));
                // Get the new resolutions, as well as the lists of minute files that are parsed
                const new_resolutions = await resolutions_1.collect_resolutions(missing_files, (file_name) => the_repo.get_file(repo.minutes, file_name));
                const new_asset = {
                    date: now,
                    short_names: [...current_asset.short_names, ...new_resolutions.short_names],
                    resolutions: [...new_resolutions.resolutions, ...current_asset.resolutions]
                };
                config_1.DEBUG('New asset:', new_asset);
                // Update/commit the new set of resolutions
                await the_repo.update(repo.current, `Updated resolution list for ${now}`, new_asset, current_sha);
                config_1.LOG('Updated');
            }
        }
        catch (e) {
            config_1.LOG(`Problems: ${e} with`, repo_log);
        }
        finally {
            config_1.LOG('===');
        }
    };
    // Get hold of the github credentials
    try {
        const fname = path.join(process.env.HOME, config_1.USER_CONFIG_NAME);
        const config_content = await fsp.readFile(fname, 'utf-8');
        github_credentials = JSON.parse(config_content);
    }
    catch (e) {
        console.log(`Could not get hold of the github credentials: ${e}`);
        process.exit(-1);
    }
    config_1.DEBUG('Credentials:', github_credentials);
    // It is necessary to do it this way to ensure a non-overlapping set of logs
    for (let i = 0; i < config_1.GITHUB_REPOS.length; i++) {
        await handle_one_repo(config_1.GITHUB_REPOS[i]);
    }
}
exports.github_repos = github_repos;
/* ------------------------------------------------------------------------------------------------- */
/**
 * The main processing for local repositories: for each repo in [[LOCAL_REPOS]]:
 *
 * 1. get the “current” list of resolution from the local repo,
 * 2. compare them to the list of minutes in the folder marked to contain the minutes
 * 3. generate the missing set of resolutions by invoking [[collect_resolutions]] function on the list of minute references
 * 4. merge the results with the “current” list
 * 5. overwrite the “current” list of resolution with the new content
 *
 * @async
 */
async function local_repos() {
    const handle_one_repo = async (local_repo) => {
        const now = (new Date()).toISOString();
        const repo_log = local_repo.dir;
        try {
            config_1.LOG(`=== ${now} (run on local repos)`);
            config_1.LOG('Updating', repo_log);
            let current;
            try {
                const current_data = await fsp.readFile(path.join(local_repo.dir, local_repo.current), 'utf-8');
                current = JSON.parse(current_data);
            }
            catch (e) {
                current = {
                    short_names: [],
                    resolutions: []
                };
            }
            config_1.DEBUG('Current assets', current);
            const list_of_minutes = await fsp.readdir(path.join(local_repo.dir, local_repo.minutes), 'utf-8');
            config_1.DEBUG('Current listing', list_of_minutes);
            const missing_files = resolutions_1.filter_resolutions(list_of_minutes, current);
            config_1.DEBUG('To be used for new resolutions', missing_files);
            if (missing_files.length === 0) {
                config_1.LOG('No new minutes to process');
            }
            else {
                missing_files.forEach((fname) => config_1.LOG(`Processing ${fname}`));
                const minutes_full_path = path.join(local_repo.dir, local_repo.minutes);
                const new_resolutions = await resolutions_1.collect_resolutions(missing_files, (file_name) => fsp.readFile(path.join(minutes_full_path, file_name), 'utf-8'));
                config_1.DEBUG('New set of resolutions', new_resolutions);
                const new_asset = {
                    date: now,
                    short_names: [...current.short_names, ...new_resolutions.short_names],
                    resolutions: [...new_resolutions.resolutions, ...current.resolutions]
                };
                config_1.DEBUG('New asset:', new_asset);
                await fsp.writeFile(path.join(local_repo.dir, local_repo.current), JSON.stringify(new_asset, null, 4), 'utf-8');
                config_1.LOG('Updated');
            }
        }
        catch (e) {
            config_1.LOG(`Problems: ${e} with`, repo_log);
        }
        finally {
            config_1.LOG('===');
        }
    };
    // It is necessary to do it this way to ensure a non-overlapping set of logs
    for (let i = 0; i < config_1.LOCAL_REPOS.length; i++) {
        await handle_one_repo(config_1.LOCAL_REPOS[i]);
    }
}
exports.local_repos = local_repos;
//# sourceMappingURL=repos.js.map