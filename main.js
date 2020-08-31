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
        // extract all resolutions from the markdown text, returning an array of resolution objects
        .map(get_resolutions)
        // add the group name to each resolution, based on the file name
        .map((res_array, index) => {
            // extract the group name from the file short name
            const call = short_names[index].split('.')[0].slice(11)
            return res_array.map((resolution) => {
                resolution.call = call;
                return resolution;
            });
        })
        // turn array of arrays into a single array
        .reduce((accumulator, currentValue) => [...accumulator, ...currentValue],[])
        // sort the resolution.
        .sort(sort_resolutions);

    return {
        short_names,
        resolutions,
    }
}

async function main(file_names) {
    const FNAME = 'assets/resolutions.json';
    let current;
    try {
        const current_data    = await fsp.readFile(FNAME,'utf-8');
        current               = JSON.parse(current_data);    
    } catch(e) {
        current = {
            short_names : [],
            resolutions : []
        }
    }
    const missing_files   = filter_resolutions(file_names, current);
    const new_resolutions = await collect_resolutions(missing_files);
    const new_asset       = {
        short_names : [...new_resolutions.short_names, ...current.short_names],
        resolutions : [...new_resolutions.resolutions, ...current.resolutions]
    } 
    await fsp.writeFile(FNAME, JSON.stringify(new_asset, null, 4), 'utf-8')
}


// Do it
main(process.argv.slice(2))
