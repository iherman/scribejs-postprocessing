"use strict";
/**
 * ## Gathering the issue comments and add these comments to the relevant issues on github
 *
 * See [[collect_resolutions]] for the essential entry point.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.collect_issue_comments = void 0;
const githubapi_1 = require("./js/githubapi");
const utils_1 = require("./utils");
/**
 * Caching the existing github access objects, using the 'owner/repo' values as key
 * in the cache. (It is not necessary to create a new instance of such an object
 * for every occurrence of a comment...)
 */
class GithubCache {
    /**
     *
     * @param gh_credentials - the user's necessary credential data. Only the OAUth token is used.
     */
    constructor(gh_credentials) {
        this.values = {};
        this.gh_token = gh_credentials.ghtoken;
    }
    /**
     * Return a [[Github]] object to access the repository via the Github API. If this object has already been created it will return it; if not, it will be created first and stored.
     *
     * @param owner - github repository owner
     * @param repo - github repository name
     */
    gh(owner, repo) {
        const key = `${owner}/${repo}`;
        if (this.values[key] === undefined) {
            this.values[key] = new githubapi_1.Github(this.gh_token, owner, repo);
        }
        return this.values[key];
    }
}
/**
 * Issue handling: the relevant github access and the issue number; can be used to add a comment to that specific issue.
 */
class IssueHandler_Impl {
    /**
     *
     * @param github_cache - the only value that is important is the OAuth token, used to initialize a [[GithubCache]] objects
     * @param args - strings of the form `owner/repo/number`, generated (as comment) into the markdown minutes by `scribejs`
     */
    constructor(github_cache, args) {
        const [owner, repo, issue] = args.split('/');
        this.owner = owner;
        this.repo = repo;
        this.issue = Number.parseInt(issue);
        if (this.issue === undefined || Number.isNaN(this.issue)) {
            utils_1.LOG(`Illegal issue identifier :`, args);
            // This handler will be filtered out from the overall results
            this.issue = undefined;
        }
        this.github_access = github_cache.gh(owner, repo);
    }
    /**
     * Add a comment to this issue.
     *
     * @param comment - comment body
     */
    add_comment(comment) {
        utils_1.LOG('Adding a comment to:', `#${this.issue} on ${this.owner}/${this.repo}`);
        return this.github_access.comment(this.issue, comment);
    }
}
/**
 * Discussion on specific issues, extracted from the minutes and used to add comments to specific issues.
 */
class IssueDiscussion_Impl {
    constructor(date) {
        /**
         * The same discussion may be relevant to several issues, hence the usage of an array.
         */
        this.issues = [];
        /**
         * Resolutions are collected for a better comment on the issues.
         */
        this.resolutions = [];
        /**
         * URL of the relevant section (to create a full URL to the minutes)
         */
        this.section = '';
        /**
         * Date of the call whose minutes are used
         */
        this.date = '';
        /**
         * Extract of the minutes: the list of minutes text lines in markdown.
         */
        this.minute_extract = [];
        this.date = date;
    }
    /**
     * Collects all the data to produce a proper comment text, to be added to the issue(s).
     */
    create_comment() {
        let retval = `The issue was discussed in a [meeting](${this.section}) on ${this.date})\n\n`;
        if (this.resolutions.length === 0) {
            retval += '- no resolutions were taken\n\n';
        }
        else {
            retval += 'List of resolutions:\n\n';
            retval += this.resolutions.map((res) => `- ${res}`).join('/n') + '\n\n';
        }
        retval += '<details><summary><i>View the transcript</i></summary>\n\n';
        retval += this.minute_extract.join('\n');
        retval += '\n</details>';
        return retval;
    }
    /**
     * Initiate all the issue generation threads (there may be several of them, see [[issues]])
     *
     * @returns - an array for all the Promises, each belonging to a single comment added to a single issue
     */
    add_comments() {
        const comment = this.create_comment();
        return this.issues.map((issue) => issue.add_comment(comment));
    }
}
/**
 * Extract the discussions around issues.
 *
 * The process looks for section (or subsection) headings; if those headings include a reference to an issue (or PR) a new [[IssueDiscussion]] is initiated.
 * This means collecting the markdown lines until the next (sub)heading, or an explicit line if the form:
 *
 * ```
 * <!-- issue - -->
 * ```
 *
 * The result is a list of issue discussion objects, each with its own associated issues; these can be used to
 * generate the issue comments themselves.
 *
 * @param github_cache - the important item is to extract the OAUth token of the user
 * @param minutes - the minutes as a series of markdown lines.
 */
function get_issue_comments(github_cache, minutes) {
    try {
        const lines = minutes.split('\n');
        const schema = utils_1.get_schema(lines);
        if (schema === null) {
            utils_1.DEBUG(`The JSON-LD preamble is missing or could not be extracted`);
            return [];
        }
        utils_1.DEBUG("schema: ", schema);
        const url = schema.url;
        const date = schema.dateCreated;
        utils_1.LOG(`Collecting issue comments for ${url}`);
        const retval = [];
        let current_issue = undefined;
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            if (line.startsWith('{:')) {
                // This should be removed, because it is a kramdown specific syntax that does not work for github...
                continue;
            }
            else if (line.startsWith('##')) {
                // this is a new header!
                // 1. if there was a valid issue comments in the previous block, store it
                if (current_issue !== undefined && current_issue.issues.length !== 0) {
                    retval.push(current_issue);
                }
                // 2. start fresh with the comments
                current_issue = new IssueDiscussion_Impl(date);
                // 3. find the identifier of the session and use it to define a full URL to the section
                const id_line = lines[index + 1];
                if (id_line[0] === '{') {
                    current_issue.section = `${url}${id_line.split(' ')[1].slice(0, -1)}`;
                }
            }
            else if (line.startsWith('<!--')) {
                if (current_issue !== undefined) {
                    // These assign issues to the comments, that is where the real meat is!
                    const issue_ids = line.split(' ').slice(2, -1);
                    if (issue_ids.length > 1 && issue_ids[0] === '-') {
                        // this is a sign that the current comment line should be closed
                        if (current_issue.issues.length !== 0) {
                            retval.push(current_issue);
                            current_issue = undefined;
                        }
                    }
                    else {
                        // Add the issues' URLs to the current comment set
                        // Create a set of issue handler objects:
                        const issue_handlers = issue_ids
                            .map((id) => new IssueHandler_Impl(github_cache, id))
                            .filter((issue_handler) => issue_handler.issue !== undefined);
                        current_issue.issues = [...current_issue.issues, ...issue_handlers];
                    }
                }
                // This line should be ignored from the output, hence the continue
                continue;
            }
            else if (line.startsWith('> ***Resolution')) {
                if (current_issue !== undefined) {
                    current_issue.resolutions.push(line);
                }
            }
            if (current_issue !== undefined) {
                current_issue.minute_extract.push(line);
            }
        }
        return retval;
    }
    catch (e) {
        utils_1.DEBUG("Exception in issue comment extraction: ", e);
        return [];
    }
}
/**
 *
 * Collect all the issues. The function calls out, for each minute file, to the [[get_issue_comments]] function, and then add these comments to the issues themselves,
 * using the methods provided in the [[IssueDiscussion]] instances.
 *
 * @param gh_credentials - the user's Github credentials
 * @param file_names - List of the minute file names, i.e., the base name of the minute file in its repository
 * @param get_data - A function returning the markdown content of the minutes in a Promise. The function itself either uses the local file system read or a fetch to the repository, depending on whether this function is called for a local or a github repository.
 * @returns  - List of resolutions
 * @async
 */
async function collect_issue_comments(gh_credentials, file_names, get_data) {
    const minutes_promises = file_names.map((file_name) => get_data(file_name));
    const all_minutes = await Promise.all(minutes_promises);
    const github_cache = new GithubCache(gh_credentials);
    // This is, in theory, suboptimal, because all async steps could be handled in one giant "Promise.all()". However, this ensures a proper
    // log output which, otherwise may look messy
    for (let i = 0; i < all_minutes.length; i++) {
        const minutes = all_minutes[i];
        // collect the issue related discussions for the minutes
        const all_discussions = get_issue_comments(github_cache, minutes);
        const all_promises = all_discussions
            .map((discussion) => discussion.add_comments())
            .reduce(utils_1.flatten, []);
        await Promise.all(all_promises);
    }
    return;
}
exports.collect_issue_comments = collect_issue_comments;
//# sourceMappingURL=issues.js.map