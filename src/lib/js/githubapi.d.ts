#!/usr/bin/env node
/**
 * ## Minimal Interfacing the GitHub API
 * 
 * This is not a complete API mapping, rather than the minimal configuration needed and implemented as a wrapper around the octocat JavaScript module.
 * 
 * (I wish there was a full TypeScript type definition for octocat, which would make this wrapper unnecessary...)
 *
 * @packageDocumentation
*/



/**
 * Wrapper around a the Github API using the more generic octocat library.
 *
 */
export class Github {
    /**
     *
     * @param {string} token - Github API Token
     * @param {string} owner - Repository Owner
     * @param {string} repo - Repository
     */
    constructor(token: string, owner: string, repo: string);

    private repo_access: any;
    private repo: string;
    private owner: string;

    /**
     * Get the JSON content of a repository content.
     * 
     * @param {string} path - Path to the content
     * @returns {Promise<any>} - JSON content turned into an object
     * @async
     */
    get_json(path: string): Promise<Github.JSONContent>;

    /**
     * Get the listing of a directory in the repository.
     *
     * @param {string} path - Path to the directory
     * @param {number} page_size - Page size (defaults to null, ie, no page size set)
     * @returns {Promise<any>} - Github API object for the listing
     * @async
     */
    get_listing(path: string, page_size?: number): Promise<any>;

    /**
     * Get (markdown) file.
     *
     * @param {string} path - Path to the directory containing the file
     * @param {string} file_name - the file name within the directory
     * @returns {Promise<string>} - the raw content of the file
     * @async
     */
    get_file(path: string, file_name: string): Promise<string>;

    /**
     * Update a (JSON) content.
     *
     * @param {string} path - Path to the directory containing the file
     * @param {string} message - Message for the commit
     * @param {any} new_content - New content
     * @param {string} sha - SHA value if this is an update, undefined if this is a new content
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    update(path: string, message: string, new_content: any, sha?: string): Promise<void>;

    /**
     * Get the list of assignees' logins. The method takes care of paging.
     *
     * @return - list of github login names for the assignees
     * @async
     */
    get_assignees(): Promise<string[]>;

    /**
     * Create a new issue.
     * 
     * @param {string} issue 
     */
    create_issue(issue: Github.IssueData): Promise<void>;

    /**
     * Add a comment to an issue.
     * 
     * @param issue_number - Issue number on the repository
     * @param body - The comment text itself
     */
    comment(issue_number: number, body: string): Promise<void>;
}

/**
 * The [[get_json]] method returns both the parsed JSON value as an object, as well as
 * the SHA value (used for a possible future update)
 */
declare namespace Github {
    export interface JSONContent {
        content: any;
        sha: string;
    }

    /**
     * Data needed to raise an issue on github
     */
    export interface IssueData {
        /** Title of the issue */
        title: string;
        /** Text of the issue */
        body: string;
        /** Labels to be assigned to the issue */
        labels: string[];
        /** Person to assign the issue to */
        assignee?: string;
    }
}
