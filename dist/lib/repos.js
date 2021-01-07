"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process_minutes = void 0;
const path = require("path");
const fs = require("fs");
/** @internal */
const fsp = fs.promises;
const githubapi_1 = require("./js/githubapi");
const config_1 = require("./config");
const resolutions_1 = require("./resolutions");
const issues_1 = require("./issues");
const utils_1 = require("./utils");
const actions_1 = require("./actions");
/**
 * Current date, used to annotate the generated minute processing logs
 */
const now = (new Date()).toISOString();
/**
 * Generic class for managing minutes. The real work is done in other modules, this just provides the general framework of
 * managing the information for one repository.
 *
 */
class RepoProcessing {
    constructor(the_repo, credentials) {
        /** List of minute file names. This is set in the relevant subclasses. */
        this.list_of_minutes = [];
        this.repo = the_repo;
        this.gh_credentials = credentials;
    }
    /**
     * Processing the information for a single repository. This is mostly a shell around the real work done in other modules.
     * The function
     *
     * 1. filters out the minutes that have not yet been handled (this information is part of [[current]])
     * 2. goes through the processing (resolution gathering, issues, etc)
     * 3. updates the value of [[current]] and uploads it to the repository
     *
     * The two callback functions are instantiated in the subclasses to either read/write from/to a local directory or the (remove) github repository.
     *
     * @param current - collection of information related to the current status for the repository
     * @param get_data - callback function used to get to the content of the minute for a single file
     * @param write_data - callback function used to store the new content on the repository
     */
    async process_minutes(current, get_data, write_data) {
        // Filter out minutes files that have already been treated in a previous run
        const missing_files = utils_1.filter_resolutions(this.list_of_minutes, current);
        utils_1.DEBUG('To be used for new processing', missing_files);
        if (missing_files.length === 0) {
            utils_1.LOG('No new minutes to process');
        }
        else {
            missing_files.forEach((fname) => utils_1.LOG(`Processing ${fname}`));
            // This is the external method that gathers the resolution for all minutes. It returns a new
            // MinuteProcessing structure, including the list of files that have been treated and the corresponding
            // resolutions.
            // Because this asset is used to display the resolution when jekyll runs, both content must go 'back' to
            // the repository (see below)
            const new_resolutions = await resolutions_1.collect_resolutions(missing_files, get_data);
            utils_1.DEBUG('New set of resolutions', new_resolutions);
            if (this.repo.handle_issues) {
                await issues_1.collect_issue_comments(this.gh_credentials, missing_files, get_data);
                utils_1.LOG('Collected the issue comments');
            }
            else {
                utils_1.LOG('No issue collection required');
            }
            if (this.repo.handle_actions) {
                await actions_1.process_actions(this.gh_credentials, missing_files, get_data);
                utils_1.LOG('Raised the action issues');
            }
            else {
                utils_1.LOG('No action management required');
            }
            // "Merge" the MinuteProcessing structure of the resolution gathering with the current one
            // before uploading it
            let new_asset;
            try {
                new_asset = {
                    date: now,
                    file_names: [...current.file_names, ...new_resolutions.file_names],
                    resolutions: [...new_resolutions.resolutions, ...current.resolutions],
                };
            }
            catch {
                new_resolutions.date = now;
                new_asset = new_resolutions;
            }
            utils_1.DEBUG('New asset:', new_asset);
            if (config_1.DO_UPDATE) {
                await write_data(new_asset);
                utils_1.LOG('Updated');
            }
            else {
                utils_1.LOG('Update skipped to ease debugging!');
            }
        }
    }
}
/**
 * Repository management for a (remote) github repository. The necessary information are gathered via the Github API.
 */
class GithubRepoProcessing extends RepoProcessing {
    constructor(the_repo, credentials) {
        super(the_repo, credentials);
    }
    /**
     * Concrete implementation of the abstract method. Access to the github repository is based on the user’s API token, stored in the local configuration file (see [[USER_CONFIG_NAME]])
     */
    async handle_one_repo() {
        // Note that the JSON based structures returned from the Github API are all typed as "any". It would be
        // nice if a proper Typescript definition was available for those but, alas!, I did not see any and
        // I did not define them
        const repo = this.repo;
        const repo_log = { owner: repo.owner, repo: repo.repo };
        try {
            utils_1.LOG(`=== ${now} (run on github repos)`);
            utils_1.LOG('Updating', repo_log);
            const the_repo = new githubapi_1.Github(this.gh_credentials.ghtoken, repo.owner, repo.repo);
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
                    file_names: [],
                    resolutions: [],
                };
                current_sha = undefined;
            }
            // Get hold of the list of minute files
            try {
                const list_of_minutes_wrappers = await the_repo.get_listing(repo.minutes, 400);
                this.list_of_minutes = list_of_minutes_wrappers.items.map((item) => item.downloadUrl.split('/').pop());
                utils_1.DEBUG('Current listing', this.list_of_minutes);
            }
            catch (e) {
                utils_1.LOG('No minutes to process');
                return;
            }
            // Get the new resolutions, as well as the lists of minute files that are parsed
            await this.process_minutes(current_asset, (file_name) => the_repo.get_file(repo.minutes, file_name), 
            // eslint-disable-next-line comma-dangle
            (content) => the_repo.update(repo.current, `Updated process list for ${now}`, content, current_sha));
        }
        catch (e) {
            utils_1.LOG(`Problems: ${e} with`, repo_log);
            utils_1.DEBUG(e.stack);
        }
        finally {
            utils_1.LOG('===');
        }
    }
}
/**
 * Repository management for a local copy of a repository. The necessary information are gathered via the filesystem API of node.js.
 */
class LocalRepoProcessing extends RepoProcessing {
    constructor(the_repo, credentials) {
        super(the_repo, credentials);
    }
    /**
     * Concrete implementation of the abstract method. Access to the local repository clone is based on the filesystem API of node.js.
     */
    async handle_one_repo() {
        const local_repo = this.repo;
        const repo_log = local_repo.dir;
        try {
            utils_1.LOG(`=== ${now} (run on local repos)`);
            utils_1.LOG('Updating', repo_log);
            let current;
            try {
                const current_data = await fsp.readFile(path.join(local_repo.dir, local_repo.current), 'utf-8');
                current = JSON.parse(current_data);
            }
            catch (e) {
                current = {
                    file_names: [],
                    resolutions: [],
                };
            }
            utils_1.DEBUG('Current assets', current);
            try {
                this.list_of_minutes = await fsp.readdir(path.join(local_repo.dir, local_repo.minutes), 'utf-8');
                utils_1.DEBUG('Current listing', this.list_of_minutes);
            }
            catch (e) {
                utils_1.LOG('No minutes to process');
                return;
            }
            const minutes_full_path = path.join(local_repo.dir, local_repo.minutes);
            await this.process_minutes(current, (file_name) => fsp.readFile(path.join(minutes_full_path, file_name), 'utf-8'), 
            // eslint-disable-next-line comma-dangle
            (content) => fsp.writeFile(path.join(local_repo.dir, local_repo.current), JSON.stringify(content, null, 4), 'utf-8'));
        }
        catch (e) {
            utils_1.LOG(`Problems: ${e} with`, repo_log);
            utils_1.DEBUG(e.stack);
        }
        finally {
            utils_1.LOG('===');
        }
    }
}
/**
 * Switch between the local and global repository handling.
 *
 * Depending on the value of [[local]] create an appropriate subclass instance of [[Repo_Processing]] and run the respective `handle_one_repo` method.
 *
 * @param config - The configuration file.
 */
async function process_minutes(config) {
    let github_credentials;
    try {
        const fname = path.join(process.env.HOME, config_1.USER_CONFIG_NAME);
        const config_content = await fsp.readFile(fname, 'utf-8');
        github_credentials = JSON.parse(config_content);
    }
    catch (e) {
        console.log(`Could not get hold of the github credentials: ${e}`);
        process.exit(-1);
    }
    const processing = config.local ?
        new LocalRepoProcessing(config, github_credentials) : new GithubRepoProcessing(config, github_credentials);
    await processing.handle_one_repo();
}
exports.process_minutes = process_minutes;
//# sourceMappingURL=repos.js.map