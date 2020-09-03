#!/usr/bin/env node
'use strict';

const { USER_CONFIG_NAME, LOCAL_REPOS, GITHUB_REPOS, LOG, DEBUG } = require('./lib/config');
const { github_repos, local_repos } = require('./lib/repos');

async function main() {
    const flag = process.argv.pop();
    flag === '-l' || flag === '--local' ? local_repos() : github_repos();
}

main();

