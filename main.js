#!/usr/bin/env node
'use strict';

const fs  = require('fs');
const fsp = fs.promises;
const { get_resolutions, sort_resolutions, filter_resolutions } = require('./lib/resolutions');

async function collect_resolutions(file_names) {
    const short_names      = file_names.map((file_name) => file_name.split('/')).map((splitted) => splitted.pop())
    const minutes_promises = file_names.map((file_name) => fsp.readFile(file_name, 'utf-8'));
    const minutes          = await Promise.all(minutes_promises);
    const resolutions      = minutes
        .map(get_resolutions)
        .reduce((accumulator, currentValue) => [...accumulator, ...currentValue],[])
        .sort(sort_resolutions);

    return {
        short_names,
        resolutions,
    }
}

async function main(file_names) {
    const current_data    = await fsp.readFile('assets/resolutions.json','utf-8');
    const current         = JSON.parse(current_data);
    const missing_files   = filter_resolutions(file_names, current);
    const new_resolutions = await collect_resolutions(missing_files);
    const new_asset       = {
        short_names : [...new_resolutions.short_names, ...current.short_names],
        resolutions : [...new_resolutions.resolutions, ...current.resolutions]
    } 
    console.log(JSON.stringify(new_asset,null,4));
}


// Do it
main(process.argv.slice(2))
