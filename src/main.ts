#!/usr/bin/env node
/**
 * ## Main entry point
 * 
 * See [[main]] for details.
 *
 * @packageDocumentation
*/


import { github_repos, local_repos } from './lib/repos';

/**
 * Entry point: a simple switch between handling local repos (see [[local_repos]]) and github repos (see [[github_repos]]).
 * 
 * The switch between local and github is based on the presence or not of the `-l` (or `--local`) flag.
 * 
 * @async
 */
async function main() {
    const flag: string = process.argv.pop();
    flag === '-l' || flag === '--local' ? local_repos() : github_repos();
}

main();

