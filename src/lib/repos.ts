import * as path from 'path';
import * as fs from 'fs';
/** @internal */
const fsp = fs.promises;

import { Github }                                                                                         from "./js/githubapi";
import { MinuteProcessing, Credentials, Repo, GithubRepo, LocalRepo, GetDataCallback, WriteDataCallback } from './types';
import { USER_CONFIG_NAME, DO_UPDATE }                                                                    from './config';
import { collect_resolutions }                                                                            from './resolutions';
import { collect_issue_comments }                                                                         from './issues';
import { filter_resolutions, LOG, DEBUG }                                                                 from './utils';
import { process_actions }                                                                                from './actions';

/**
 * Current date, used to annotate the generated minute processing logs
 */
const now: string = (new Date()).toISOString();

/**
 * Generic class for managing minutes. The real work is done in other modules, this just provides the general framework of 
 * managing the information for one repository.
 * 
 */
abstract class RepoProcessing {
    /** The repository being managed. Set at initialization time */
    repo: Repo;
    /** Github credentials, necessary for some steps. Set at initialization time */
    credentials: Credentials;
    /** List of minute file names. This is set in the relevant subclasses. */
    list_of_minutes: string[] = [];

    constructor(the_repo: Repo, credentials: Credentials) {
        this.repo = the_repo;
        this.credentials = credentials;
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
    async process_minutes(current: MinuteProcessing, get_data: GetDataCallback, write_data: WriteDataCallback): Promise<void> {
        // Filter out minutes files that have already been treated in a previous run
        const missing_files = filter_resolutions(this.list_of_minutes, current);

        DEBUG('To be used for new processing', missing_files);    
        if (missing_files.length === 0) {
            LOG('No new minutes to process');
        } else {
            missing_files.forEach((fname) => LOG(`Processing ${fname}`));
    
            // This is the external method that gathers the resolution for all minutes. It returns a new
            // MinuteProcessing structure, including the list of files that have been treated and the corresponding
            // resolutions.
            // Because this asset is used to display the resolution when jekyll runs, both content must go 'back' to
            // the repository (see below)
            const new_resolutions: MinuteProcessing = await collect_resolutions(missing_files, get_data);
            DEBUG('New set of resolutions', new_resolutions);

            if (this.repo.handle_issues) {
                await collect_issue_comments(this.credentials, missing_files, get_data);
                LOG('Collected the issue comments');
            } else {
                LOG('No issue collection required');
            }

            if (this.repo.handle_actions) {
                await process_actions(this.credentials, missing_files, get_data);
                LOG('Raised the action issues');
            } else {
                LOG('No action management required');
            }
        
            // "Merge" the MinuteProcessing structure of the resolution gathering with the current one
            // before uploading it
            let new_asset: MinuteProcessing;
            try {
                new_asset = {
                    date        : now,
                    file_names  : [...current.file_names, ...new_resolutions.file_names],
                    resolutions : [...new_resolutions.resolutions, ...current.resolutions],
                }
            } catch {
                new_resolutions.date = now;
                new_asset = new_resolutions;
            }

            DEBUG('New asset:', new_asset);
            if (DO_UPDATE) {
                await write_data(new_asset);
                LOG('Updated');    
            } else {
                LOG('Update skipped to ease debugging!');
            }
        }
    }

    /**
     * The main processing for repositories:
     * 
     * 1. get the “current” list of resolution from the repo,
     * 2. compare them to the list of minutes in the folder marked to contain the minutes
     * 3. generate the missing set of resolutions by invoking [[collect_resolutions]] function on the list of minute references
     * 4. handles the issue comments
     * 5. merge the results with the “current” list
     * 6. commit a new “current” list of resolution on the repo (making use of the user’s API token)
     * 
     * the steps 2-6 are actually done in the [[process_minutes]] method, through callbacks that are defined in the concrete implementations of the method. 
     * 
     * Access to the github repository (i.e., step 6 above) is based on the user’s API token, stored in the local configuration file (see [[USER_CONFIG_NAME]])
     * 
     */
    abstract handle_one_repo(): Promise<void>;
}

/**
 * Repository management for a (remote) github repository. The necessary information are gathered via the Github API.
 */
class GithubRepoProcessing extends RepoProcessing {
    constructor(the_repo: GithubRepo, credentials: Credentials) {
        super(the_repo, credentials);
    }

    /**
     * Concrete implementation of the abstract method. Access to the github repository is based on the user’s API token, stored in the local configuration file (see [[USER_CONFIG_NAME]])
     */
    async handle_one_repo(): Promise<void> {
        // Note that the JSON based structures returned from the Github API are all typed as "any". It would be
        // nice if a proper Typescript definition was available for those but, alas!, I did not see any and
        // I did not define them
        const repo = this.repo as GithubRepo;
        const repo_log = {owner: repo.owner, repo: repo.repo};
        try {
            LOG(`=== ${now} (run on github repos)`);
            LOG('Updating', repo_log);
            const the_repo: Github = new Github(this.credentials.ghtoken, repo.owner, repo.repo)

            // Get hold of the asset file to see what is there...
            let current_asset: MinuteProcessing;
            let current_sha: string;
            try {
                const gh_data: Github.JSONContent = await the_repo.get_json(repo.current);
                current_asset = gh_data.content as MinuteProcessing;
                current_sha = gh_data.sha;
            } catch (e) {
                current_asset = {
                    file_names  : [],
                    resolutions : [],
                }
                current_sha = undefined;
            }

            // Get hold of the list of minute files
            try {
                const list_of_minutes_wrappers = await the_repo.get_listing(repo.minutes, 400);
                this.list_of_minutes = list_of_minutes_wrappers.items.map((item: any): string => item.downloadUrl.split('/').pop());
                DEBUG('Current listing', this.list_of_minutes);    
            } catch (e) {
                LOG('No minutes to process')
                return;
            }

            // Get the new resolutions, as well as the lists of minute files that are parsed
            await this.process_minutes(
                current_asset, 
                (file_name) => the_repo.get_file(repo.minutes, file_name),
                // eslint-disable-next-line comma-dangle
                (content) => the_repo.update(repo.current, `Updated process list for ${now}`, content, current_sha)
            );
        } catch (e) {
            LOG(`Problems: ${e} with`, repo_log)
            DEBUG(e.stack);
        } finally {
            LOG('===')
        }
    }
}

/**
 * Repository management for a local copy of a repository. The necessary information are gathered via the filesystem API of node.js.
 */
class LocalRepoProcessing extends RepoProcessing {
    constructor(the_repo: LocalRepo, credentials: Credentials) {
        super(the_repo, credentials);
    }

    /**
     * Concrete implementation of the abstract method. Access to the local repository clone is based on the filesystem API of node.js.
     */
    async handle_one_repo(): Promise<void> {
        const local_repo = this.repo as LocalRepo;
        const repo_log = local_repo.dir;
        try {
            LOG(`=== ${now} (run on local repos)`);
            LOG('Updating', repo_log);

            let current: MinuteProcessing;
            try {
                const current_data = await fsp.readFile(path.join(local_repo.dir, local_repo.current),'utf-8');
                current = JSON.parse(current_data) as MinuteProcessing;    
            } catch (e) {
                current = {
                    file_names  : [],
                    resolutions : [],
                }
            }
            DEBUG('Current assets', current); 

            try {
                this.list_of_minutes = await fsp.readdir(path.join(local_repo.dir, local_repo.minutes), 'utf-8');
                DEBUG('Current listing', this.list_of_minutes);    
            } catch (e) {
                LOG('No minutes to process')
                return;
            }

            const minutes_full_path: string = path.join(local_repo.dir, local_repo.minutes);
            await this.process_minutes( 
                current, 
                (file_name) => fsp.readFile(path.join(minutes_full_path, file_name),'utf-8'),
                // eslint-disable-next-line comma-dangle
                (content) => fsp.writeFile(path.join(local_repo.dir, local_repo.current), JSON.stringify(content, null, 4), 'utf-8')
            );
        } catch (e) {
            LOG(`Problems: ${e} with`, repo_log);
            DEBUG(e.stack);
        } finally {
            LOG('===')
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
export async function process_minutes(config: Repo): Promise<void> {
    let credentials: Credentials;
    try {
        const fname: string          = path.join(process.env.HOME, USER_CONFIG_NAME);
        const config_content: string = await fsp.readFile(fname, 'utf-8');
        credentials = JSON.parse(config_content) as Credentials;
    } catch (e) {
        console.log(`Could not get hold of the github credentials: ${e}`);
        process.exit(-1);
    }

    const processing = config.local ? 
        new LocalRepoProcessing(config as LocalRepo, credentials) : new GithubRepoProcessing(config as GithubRepo, credentials);
    await processing.handle_one_repo();
}
