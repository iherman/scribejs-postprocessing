/**
 * ## Gathering the issues
 * 
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/

import { Github }                                            from "./js/githubapi";
import { GetDataCallback, IssueComments, GithubCredentials, IssueData } from './types';
import { get_schema, DEBUG, LOG }                            from './utils';

interface gh_cache {
    [key:string]: Github
}

/**
 * Caching the existing github access objects, using the 'owner/repo' values as key
 * in the cache. (It is not necessary to create a new instance of such an object
 * for every occurrence of a comment...)
 */
class GithubCache {
    private gh_token: string;
    private values: gh_cache = {};
    constructor(gh_credentials: GithubCredentials) {
        this.gh_token = gh_credentials.ghtoken;
    }
    gh(owner: string, repo: string): Github {
        const key = `${owner}/${repo}`;
        if (this.values[key] === undefined) {
            this.values[key] = new Github(this.gh_token, owner, repo);
        }
        return this.values[key];
    }
}

class IssueHandler implements IssueData {
    issue: number;
    github_access: Github;

    constructor(github_cache: GithubCache, args: string) {
        const [owner, repo, issue] = args.split('/')
        this.issue = Number.parseInt(issue);
        if (this.issue === undefined || Number.isNaN(this.issue)) {
            LOG(`Illegal issue number :`, issue);
            this.issue = 0;
        }
        this.github_access = github_cache.gh(owner, repo);
    }

    add_comment(comment: string): Promise<void> {
        return this.github_access.comment(this.issue, comment)
    }
}

/**
 * Wrapper around each issue comment.
 */
class IssueComments_Impl implements IssueComments {
    issues: IssueHandler[] = [];
    resolutions: string[] = [];
    section = '';
    date = '';
    minute_extract: string[] = [];

    constructor(date: string) {
        this.date = date;
    }

    create_comment(): string {
        let retval = `The issue was discussed in a [meeting](${this.section}) on ${this.date})\n\n`;
        if (this.resolutions.length === 0) {
            retval += '- no resolutions were taken\n\n'
        } else {
            retval += 'List of resolutions:\n\n'
            retval += this.resolutions.map((res) => `- ${res}`).join('/n') + '\n\n';
        }
        retval += '<details><summary><i>View the transcript</i></summary>\n\n';
        retval += this.minute_extract.join('\n')
        retval += '\n</details>'
        return retval
    }

    add_comments(): Promise<void>[] {
        const comment = this.create_comment();
        return this.issues.map((issue) => issue.add_comment(comment));
    }
}

function get_issue_comments(github_cache: GithubCache, minutes: string): IssueComments[] {
    try {
        const lines: string[] = minutes.split('\n');
        const schema: any     = get_schema(lines);
        if (schema === null) {
            DEBUG(`The JSON-LD preamble is missing or could not be extracted`);
            return [];
        }
        DEBUG("schema: ", schema);

        const url: string  = schema.url;
        const date: string = schema.dateCreated;

        LOG(`Collecting issue comments for ${url}`)

        const retval: IssueComments[] = [];
        let current_issue: IssueComments = undefined;

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            if (line.startsWith('{:')) {
                // This should be removed, because it is a kramdown specific syntax that does not work for github...
                continue;
            } else if (line.startsWith('##')) {
                // this is a new header!
                // 1. if there was a valid issue comments in the previous block, store it
                if (current_issue !== undefined && current_issue.issues.length !== 0) {
                    retval.push(current_issue);
                }

                // 2. start fresh with the comments
                current_issue = new IssueComments_Impl(date);

                // 3. find the identifier of the session and use it to define a full URL to the section
                const id_line = lines[index + 1]
                if (id_line[0] === '{') {
                    current_issue.section = `${url}${id_line.split(' ')[1].slice(0,-1)}`;
                }
            } else if (line.startsWith('<!--')) {
                if (current_issue !== undefined) {
                    // These assign issues to the comments, that is where the real meat is!
                    const issue_ids = line.split(' ').slice(2,-1);

                    if (issue_ids.length > 1 && issue_ids[0] === '-') {
                        // this is a sign that the current comment line should be closed
                        if (current_issue.issues.length !== 0) {
                            retval.push(current_issue);
                            current_issue = undefined;
                        }
                    } else {
                        // Add the issues' URLs to the current comment set
                        // Create a set of issue handler objects:
                        const issue_handlers = issue_ids.map((id) => new IssueHandler(github_cache, id))
                        current_issue.issues = [...current_issue.issues, ...issue_handlers];
                    }
                }
                // This line should be ignored from the output, hence the continue
                continue;
            } else if (line.startsWith('> ***Resolution')) {
                if (current_issue !== undefined) {
                    current_issue.resolutions.push(line)
                }
            }

            if (current_issue !== undefined) {
                current_issue.minute_extract.push(line);
            }
        }
        return retval;
    } catch (e) {
        DEBUG("Exception in issue comment extraction: ",e);
        return [];
    }
}


/**
 * 
 * Collect all the issues. The function calls out, for each minute file, to the [[get_issues]] function
 * 
 * @param gh_credentials - the user's Github credentials
 * @param file_names - List of the minute file names, i.e., the base name of the minute file in its repository
 * @param get_data - A function returning the markdown content of the minutes in a Promise. The function itself either uses the local file system read or a fetch to the repository, depending on whether this function is called for a local or a github repository.
 * @returns  - List of resolutions 
 * 
 * @async
 */
export async function collect_issue_comments(gh_credentials: GithubCredentials, file_names: string[], get_data: GetDataCallback): Promise<void> {
    const minutes_promises: Promise<string>[] = file_names.map((file_name) => get_data(file_name));
    const all_minutes: string[]               = await Promise.all(minutes_promises);
    const github_cache = new GithubCache(gh_credentials);

    const all_comments = all_minutes
        .map((minutes) => get_issue_comments(github_cache, minutes))
        // flatten the arrays of arrays into one single array
        .reduce((accumulator: IssueComments[], currentValue: IssueComments[]): IssueComments[] => [...accumulator, ...currentValue],[]);

    // This could/should be parallelized, but doing it the pedestrian way for the purposes of debugging!!
    for (let i = 0; i < all_comments.length; i++) {
        const comment = all_comments[i];
        const message = comment.create_comment()
        for (let j = 0; j < comment.issues.length; j++) {
            const issue = comment.issues[j];
            await issue.add_comment(message)
        }
    }
    return;
}
