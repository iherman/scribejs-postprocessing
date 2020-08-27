#!/usr/bin/env node

'use strict';

const { get_minutes }     = require('./lib/io');
const { get_resolutions } = require('./lib/get_resolution');


async function main(fname) {
    const minutes = await get_minutes(fname);
    const res = get_resolutions(minutes)

    console.log(JSON.stringify(res, null, 4));
}

// Do it
main('tests/2019-05-31-json-ld.md');
