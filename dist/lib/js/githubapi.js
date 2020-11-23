#!/usr/bin/env node
'use strict';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Octokat = require('octokat');
const base64_to_string = (data) => Buffer.from(data, 'base64').toString('utf-8');
const string_to_base64 = (string) => Buffer.from(string).toString('base64');
/**
 * Wrapper around a the Github API using the more generic octocat library.
 *
 */
class Github {
    /**
     *
     * @param {string} token - Github API Token
     * @param {string} owner - Repository Owner
     * @param {string} repo - Repository
     */
    constructor(token, owner, repo) {
        this.repo_access = new Octokat({ token: token }).repos(owner, repo);
        this.owner = owner;
        this.repo = repo;
    }
    /**
     * Get the JSON content of a repository content
     * @param {string} path - Path to the content
     * @returns {Promise<any>} - JSON content turned into an object
     * @async
     */
    async get_json(path) {
        const content_gh_data = await this.repo_access.contents(path).fetch();
        return {
            content: JSON.parse(base64_to_string(content_gh_data.content)),
            sha: content_gh_data.sha,
        };
    }
    /**
     * Get the listing of a directory in the repository
     *
     * @param {string} path - Path to the directory
     * @param {number} page_size - Page size (defaults to null, ie, no page size set)
     * @returns {Promise<any>} - Github API object for the listing
     * @async
     */
    async get_listing(path, page_size = null) {
        return page_size !== null ? this.repo_access.contents(path).fetch({ per_page: page_size }) : this.repo_access.contents(path).fetch();
    }
    /**
     * Get (markdown) file
     *
     * @param {string} path - Path to the directory containing the file
     * @param {string} file_name - the file name within the directory
     * @returns {Promise<string>} - the raw content of the file
     * @async
     */
    async get_file(path, file_name) {
        return this.repo_access.contents(path, file_name).read();
    }
    /**
     * Update a (JSON) content
     *
     * @param {string} path - Path to the directory containing the file
     * @param {string} message - Message for the commit
     * @param {any} new_content - New content
     * @param {string} sha - SHA value if this is an update, undefined if this is a new content
     */
    async update(path, message, new_content, sha = undefined) {
        const new_gh_data = {
            message: message,
            content: string_to_base64(JSON.stringify(new_content, null, 4)),
        };
        if (sha !== undefined)
            new_gh_data.sha = sha;
        await this.repo_access.contents(path).add(new_gh_data);
        return;
    }
    async comment(issue_number, body) {
        const new_gh_data = {
            owner: this.owner,
            repo: this.repo,
            issue_number: issue_number,
            body: body,
        };
        await this.repo_access.issues(issue_number).comments.create(new_gh_data);
        return;
    }
}
/* ------------------------------------------------------------ */
module.exports = { Github };
//# sourceMappingURL=githubapi.js.map