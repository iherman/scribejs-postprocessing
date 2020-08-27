'use strict';

/**
 * At some point this module will be responsible to fetch a minute for analysis from the github repo.
 * At this point, this is just shell to allow local testing/development
 */

const fs = require('fs');


/**
 * Get the minute file from its name
 */
async function get_minutes(name) {
    return new Promise((resolve, reject) => {
        fs.readFile(name, 'utf-8', (err, body) => {
            if (err) {
                reject(new Error(`problem access local file ${name}: ${err}`));
            } else {
                resolve(body);
            }
        });
    });
}

/* -------------------------------------------------------------------------------- */
module.exports = { get_minutes };
