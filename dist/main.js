#!/usr/bin/env ts-node-script
"use strict";
/**
 * ## Main entry point
 *
 * See [[main]] for details.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
const repos_1 = require("./lib/repos");
/**
 * Entry point: a simple switch between handling local repos (see [[local_repos]]) and github repos (see [[github_repos]]).
 *
 * The switch between local and github is based on the presence or not of the `-l` (or `--local`) flag.
 *
 * @async
 */
async function main() {
    const flag = process.argv.pop();
    await repos_1.process_minutes(flag === '-l' || flag === '--local');
}
main();
//# sourceMappingURL=main.js.map