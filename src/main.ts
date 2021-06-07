#!/usr/bin/env node
/**
 * ## Generic main entry point for command line run.
 * 
 * See [[main]] for details.
 *
 * @packageDocumentation
*/

import { main }    from './index';

if (process.argv.length < 3) {
    console.error('No configuration file provided')
} else {
    const local = process.argv[3] ? (process.argv[3] === '-l' || process.argv[3] === '--local') : true;
    main(process.argv[2], local);
}

