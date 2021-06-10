"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const repos_1 = require("./lib/repos");
const email_1 = require("./lib/email");
const utils_1 = require("./lib/utils");
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
async function main(name, program) {
    try {
        const local = program.local ? true : false;
        const date = program.date ? program.date : utils_1.today;
        const mail = program.mail ? true : false;
        const group = program.group ? program.group : undefined;
        const config = await utils_1.json_conf_file(name, local, group);
        const credentials = await utils_1.get_credentials();
        if (mail) {
            await email_1.send_mail(config, credentials, date);
        }
        else {
            await repos_1.process_minutes(config, credentials);
        }
    }
    catch (e) {
        console.error(`Exception raised during post-processing: ${e.stack}`);
    }
}
exports.main = main;
//# sourceMappingURL=main.js.map