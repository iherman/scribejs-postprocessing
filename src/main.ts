#!/usr/bin/env ts-node-script
/**
 * ## Main entry point
 * 
 * See [[main]] for details.
 *
 * @packageDocumentation
*/

import { process_minutes } from './lib/repos';

/**
 * Entry point: a simple switch between handling local repos (see [[local_repos]]) and github repos (see [[github_repos]]).
 * 
 * The switch between local and github is based on the presence or not of the `-l` (or `--local`) flag.
 * 
 * @async
 */
async function main() {
    const flag: string = process.argv.pop();
    await process_minutes(flag === '-l' || flag === '--local');
}

main();

