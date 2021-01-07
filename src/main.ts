#!/usr/bin/env node
/**
 * ## Main entry point for command line run
 * 
 * See [[main]] for details.
 *
 * @packageDocumentation
*/

import { main }    from './index';

if (process.argv.length < 3) {
    console.error('No configuration file provided')
} else {
    main(process.argv[2]);
}

