#!/usr/bin/env node
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
    repo: any;
    /**
     * Get the JSON content of a repository content
     * @param {string} path - Path to the content
     * @returns {Promise<any>} - JSON content turned into an object
     * @async
     */
    get_json(path: string): Promise<Github.JSONContent>;
    /**
     * Get the listing of a directory in the repository
     *
     * @param {string} path - Path to the directory
     * @param {number} page_size - Page size (defaults to null, ie, no page size set)
     * @returns {Promise<any>} - Github API object for the listing
     * @async
     */
    get_listing(path: string, page_size?: number): Promise<any>;
    /**
     * Get (markdown) file
     *
     * @param {string} path - Path to the directory containing the file
     * @param {string} file_name - the file name within the directory
     * @returns {Promise<string>} - the raw content of the file
     * @async
     */
    get_file(path: string, file_name: string): Promise<string>;
    /**
     * Update a (JSON) content
     *
     * @param {string} path - Path to the directory containing the file
     * @param {string} message - Message for the commit
     * @param {any} new_content - New content
     * @param {string} sha - SHA value if this is an update, undefined if this is a new content
     */
    update(path: string, message: string, new_content: any, sha?: string): Promise<void>;
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
}
