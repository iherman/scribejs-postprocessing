"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process_actions = void 0;
const utils_1 = require("./utils");
/**
 *
 * @param github_cache - a wrapper around Github access objects
 * @param minutes - the minutes (the only item that is relevant is the JSON-LD preamble)
 */
async function raise_action_issues(github_cache, minutes) {
    try {
        const lines = minutes.split('\n');
        const metadata = utils_1.get_schema(lines);
        if (metadata === null) {
            utils_1.DEBUG(`The JSON-LD preamble is missing or could not be extracted`);
            return;
        }
        utils_1.DEBUG("schema: ", metadata);
        if (metadata.recordedAt.potentialAction && metadata.recordedAt.potentialAction.length !== 0) {
            // 1. extract the action repository id; it is the same for all actions
            const repo_name = metadata.recordedAt.potentialAction[0].location.identifier;
            const [owner, repo] = repo_name.split('/');
            const github_access = github_cache.gh(owner, repo);
            // To avoid github issues: collect the github id-s of those that cat be assigned to anything in this repo
            const possible_assignees = await github_access.get_assignees();
            // 2. Raise an issue for each action. This collects a series of promises and they will be 'awaited' in parallel in the next step.
            const action_promises = metadata.recordedAt.potentialAction.map((action) => {
                const issue = {
                    title: action.name,
                    body: action.object,
                    labels: ['action'],
                };
                // Check whether a valid assignee has been added...
                if (action.agent.name && possible_assignees.includes(action.agent.name)) {
                    issue.assignee = action.agent.name;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [id, body] = issue.title.split(':');
                utils_1.LOG(`Recording action "${body.trim()}" as an issue on repo`, `${owner}/${repo}`);
                return github_access.create_issue(issue);
            });
            await Promise.all(action_promises);
            return;
        }
        else {
            utils_1.DEBUG("No actions to process");
            return;
        }
    }
    catch (e) {
        utils_1.DEBUG("Exception in action handling extraction: ", e);
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
async function process_actions(gh_credentials, file_names, get_data) {
    const minutes_promises = file_names.map((file_name) => get_data(file_name));
    const all_minutes = await Promise.all(minutes_promises);
    const github_cache = new utils_1.GithubCache(gh_credentials);
    // This is, in theory, suboptimal, because all async steps could be handled in one giant "Promise.all()". However, this ensures a proper
    // log output which, otherwise, may look messy
    for (let i = 0; i < all_minutes.length; i++) {
        const minutes = all_minutes[i];
        await raise_action_issues(github_cache, minutes);
    }
    return;
}
exports.process_actions = process_actions;
//# sourceMappingURL=actions.js.map