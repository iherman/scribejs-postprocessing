/**
 * ## Main entry point.
 * 
 * See [[main]] for details.
 *
 * @packageDocumentation
*/
import { Repo, Credentials }                from './lib/types';
import { process_minutes }                  from './lib/repos';
import { json_conf_file, get_credentials }  from './lib/utils';

/**
 * Entry point: get hold of the configuration file, and start processing via [[process_minutes]].
 * 
 * @param name - reference to the configuration file
 * @param local - whether the configuration and other files are local or on the github repo
 * @param group - whether the group name is other than in the configuration file itself
 * 
 * @async
 */
export async function main(name: string, local: boolean, group: string = undefined): Promise<void> {
    try {
        const config: Repo             = await json_conf_file(name, local, group);
        const credentials: Credentials = await get_credentials();
        console.log(JSON.stringify(credentials, null, 4));
        console.log(JSON.stringify(config, null, 4));
        // await process_minutes(config, credentials);
    } catch (e) {
        console.error(`Exception raised during post-processing: ${e.stack}`);
    }
}

