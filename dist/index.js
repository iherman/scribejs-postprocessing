"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const repos_1 = require("./lib/repos");
const node_fetch = require("node-fetch");
/** @internal */
const fetch = node_fetch.default;
const fs = require("fs");
/** @internal */
const fsp = fs.promises;
/**
 * Entry point: get hold of the configuration file, and start processing via [[process_minutes]].
 *
 * @param name - reference to the configuration file
 *
 * @async
 */
async function main(name) {
    const get_config = async () => {
        // See if this is a real URL:
        const local = !(name.startsWith('https://') || name.startsWith('http://'));
        if (local) {
            const data = await fsp.readFile(name, 'utf-8');
            return JSON.parse(data);
        }
        else {
            return await fetch(name).then((res) => res.json());
        }
    };
    try {
        const config = await get_config();
        await repos_1.process_minutes(config);
    }
    catch (e) {
        console.error(`Exception raised during post-processing: ${e.stack}`);
    }
}
exports.main = main;
//# sourceMappingURL=index.js.map