#!/usr/bin/env node

'use strict';

const fs  = require('fs');
const fsp = fs.promises;
const { get_resolutions } = require('./lib/get_resolution');


async function main(file_names) {
    const minutes_promises = file_names.map((file_name) => fsp.readFile(file_name, 'utf-8'));
    const minutes          = await Promise.all(minutes_promises);
    const resolutions      = minutes.map(get_resolutions).reduce((accumulator, currentValue) => {
        if (Object.keys(accumulator).includes(currentValue.year)) {
            accumulator[currentValue.year] = [...accumulator[currentValue.year], ...currentValue.resolutions];
        } else {
            accumulator[currentValue.year] = currentValue.resolutions;
        }
        return accumulator;
    }, {});

    console.log(JSON.stringify(resolutions, null, 4));
}

// Do it
main(['tests/2019-05-31-json-ld.md','tests/2019-05-07-pwg.md','tests/2020-04-21-did.md']);
