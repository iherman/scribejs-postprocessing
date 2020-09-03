#!/usr/bin/env node
'use strict';

const { USER_CONFIG_NAME, LOCAL_REPOS, GITHUB_REPOS, LOG, DEBUG } = require('./lib/config');
const { github_repos, local_repos } = require('./lib/repos');

/**
 * Entry point: a simple switch between handling local repos (see {@link local_repos}) and github repos (see {@link github_repos}).
 * 
 * The switch between local and github is based on the presence or not of the `-l` (or `--local`) flag.
 * 
 * @async
 */
async function main() {
    const flag = process.argv.pop();
    flag === '-l' || flag === '--local' ? local_repos() : github_repos();
}

main();

