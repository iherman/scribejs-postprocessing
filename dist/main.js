#!/usr/bin/env node
"use strict";
/**
 * ## Main entry point for command line run
 *
 * See [[main]] for details.
 *
 * @packageDocumentation
*/
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
if (process.argv.length < 3) {
    console.error('No configuration file provided');
}
else {
    index_1.main(process.argv[2]);
}
//# sourceMappingURL=main.js.map