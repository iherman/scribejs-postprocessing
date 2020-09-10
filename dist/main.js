#!/usr/bin/env node
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
    flag === '-l' || flag === '--local' ? repos_1.local_repos() : repos_1.github_repos();
}
main();
//# sourceMappingURL=main.js.map