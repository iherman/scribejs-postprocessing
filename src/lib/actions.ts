import { Github }                                                            from './js/githubapi';
import { GetDataCallback, GithubCredentials } from './types';
import { get_schema, DEBUG }                                   from './utils';


/**
 * Data necessary to raise an action issue. The data is stored in the JSON-LD metadata of the minutes
 * and can be processed by a separate post-processing step to raise the issues.
 */
/** @internal */
export interface Action {
    gh_action_id: string;
    title: string;
    body: string;
    assignee: string;
}


async function raise_action_issues(gh_credentials: GithubCredentials, minutes: string): Promise<void> {
    try {
        const lines: string[] = minutes.split('\n');
        const schema: any     = get_schema(lines);
        if (schema === null) {
            DEBUG(`The JSON-LD preamble is missing or could not be extracted`);
            return;
        }
        DEBUG("schema: ", schema);

        if (schema.recordedAt.potentialAction && schema.recordedAt.potentialAction.length !== 0) {
            // 1. extract the action repository id; it is the same for all actions
            const repo_name: string     = schema.recordedAt.potentialAction[0].location.identifier;
            const action_list: Action[] = schema.recordedAt.potentialAction.map( (action: any): Action => {
                return {
                    gh_action_id : action.identifier,
                    body         : action.object,
                    title        : action.title,
                    assignee     : action.agent.name,
                }
            });
            console.log( repo_name );
            console.log( JSON.stringify(action_list, null, 4);
        } else {
            DEBUG("No actions to process")
            return;
        }
    } catch (e) {
        DEBUG("Exception in action handling extraction: ",e);
        return;
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
export async function process_actions(gh_credentials: GithubCredentials, file_names: string[], get_data: GetDataCallback): Promise<void> {
    const minutes_promises: Promise<string>[] = file_names.map((file_name) => get_data(file_name));
    const all_minutes: string[]               = await Promise.all(minutes_promises);

    // This is, in theory, suboptimal, because all async steps could be handled in one giant "Promise.all()". However, this ensures a proper
    // log output which, otherwise, may look messy
    for (let i = 0; i < all_minutes.length; i++) {
        const minutes: string = all_minutes[i];
        await raise_action_issues(gh_credentials, minutes);
    }
    return;
}
