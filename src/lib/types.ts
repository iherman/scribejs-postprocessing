/**
 * ## Common types
 *
 * @packageDocumentation
*/


/**
 * Base class for representing a repository (both local and on Github)
 */
export interface Repo {
    /** Directory storing the minutes within the repository */
    minutes: string;
    /** File name of the current list or resolutions in the repository  */
    current: string;
    /** Whether the issues should also be treated and commented upon */
    handle_issues: boolean;
}

/**
 * A locally stored, cloned repository data
 */
export interface Local_Repo extends Repo {
    /** Path to the local directory for the repo */
    dir: string;
}

/**
 * Github Repository data
 */
export interface Github_Repo extends Repo {
    /** "Owner" of the repository, in Github jargon  */
    owner: string;
    /** "Repo", ie, repository name, in Github jargon */
    repo: string;
}

/**
 * Data describing a single resolution
 */
export interface Resolution {
    /**
     * Year of the resolution
     */
    year: number;

    /**
     * Date of the resolution (in ISO format)
     */
    date: string;

    /**
     * "Number" of the resolution (resolutions are numbered for a single call)
     */
    number: number;

    /**
     * Text of the resolution; this is an HTML fragment
     */
    text: string;

    /**
     * URL for the resolution (ie, the URL of the minutes with the relevant fragment ID)
     */
    url: string;

    /**
     * The short name of the Group's call. This corresponds, usually, to the IRC channel name
     * used for the call.
     * 
     */
    call: string;
}

/**
 * The collection of all the Minute actions that need saving, like Resolutions; as stored as an asset on the repository
 */
export interface MinuteProcessing {
    /**
     * List of minutes that have been processed (the items are simply the base names of the full URLs or path names)
     */
    short_names: string[];

    /**
     * List of all the resolutions
     */
    resolutions: Resolution[];

    /**
     * Date of the generation of the current resolution list
     */
    date?: string;    
}

/**
 * Callback function to retrieve the minute (either via a fetch from Github or from the
 * local file system) and return the minute text.
 * 
 * (Note that this function returns a _Promise_ for the retrieval, not the result itself!)
 */
export type GetDataCallback = (file_name: string) => Promise<string>;

/**
 * Callback function to write the final process files (either via a Github repo or to the
 * local file system).
 * 
 */
export type WriteDataCallback = (content: MinuteProcessing) => Promise<void>;

/**
 * Github credential information. This is typically stored in a user configuration file
 * and is used by the script. Note that it contains more data than what is used by the
 * script; the reason is that the same configuration file can be reused by other scripts, too.
 */
export interface Github_Credentials {
    /**
     * User name
     */
    ghname?: string;
    /**
     * User's email
     */
    ghemail?: string;
    /**
     * User's GitHub api token
     */
    ghtoken?: string
}
