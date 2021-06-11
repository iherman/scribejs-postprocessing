/**
 * ## Main entry point.
 * 
 * See [[main]] for details.
 *
 * @packageDocumentation
*/
import { Repo, Credentials }                       from './lib/types';
import { process_minutes }                         from './lib/repos';
import { send_mail }                               from './lib/email';
import { json_conf_file, get_credentials, today }  from './lib/utils';

/**
 * The arguments of interest for the main entry point.
 */
export interface Arguments {
    /** Are the various files (configurations, source, etc) local? Defaults to 'true' */
    local?: boolean;

    /** Is the required action to send out an email rather than other postprocessing */
    mail?: boolean;

    /** What is the date of the minutes? Value used if an email is sent out. Defaults to 'today' */
    date?: string;

    /** Group name (to set up the right email parameters). Defaults to the group name in the main branch of the configuration. */
    group?: string;
}


/**
 * Entry point: get hold of the configuration file, and start processing via [[process_minutes]].
 * 
 * @param name - reference to the configuration file
 * @param program - the mapping part of the parsed command line arguments
 * @param local - whether the configuration and other files are local or on the github repo
 * @param group - whether the group name is other than in the configuration file itself
 * 
 * @async
 */
export async function main(name: string, program: Arguments): Promise<void> {
    try {
        const local = program.local ? true : false;
        const date  = program.date ? program.date : today;
        const mail  = program.mail ? true : false;
        const group = program.group ? program.group : undefined;

        const config: Repo             = await json_conf_file(name, local, group);
        const credentials: Credentials = await get_credentials();

        if (mail) {
            await send_mail(config, credentials, date);
        } else {
            await process_minutes(config, credentials);
        }
    } catch (e) {
        console.error(`Exception raised during post-processing: ${e.stack}`);
    }
}

