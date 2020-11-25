/**
 * ## Main entry point
 * 
 * See [[main]] for details.
 *
 * @packageDocumentation
*/
import { Repo, GithubRepo, LocalRepo   } from './lib/types';
import { process_minutes }               from './lib/repos';

import * as node_fetch from 'node-fetch';
/** @internal */
const fetch = node_fetch.default;

import * as fs from 'fs';
/** @internal */
const fsp = fs.promises;

/**
 * Entry point: get hold of the configuration file, and start processing via [[process_minutes]].
 * 
 * @async
 */
export async function main(name: string): Promise<void> {
    const get_config = async (): Promise<Repo> => {
        // See if this is a real URL:
        const local = !(name.startsWith('https://') || name.startsWith('http://'));
        if (local) {
            const data = await fsp.readFile(name, 'utf-8');
            return JSON.parse(data) as LocalRepo;
        } else {
            return await fetch(name).then((res) => res.json()) as GithubRepo;
        }    
    }

    try {
        const config: Repo = await get_config();
        await process_minutes(config);
    } catch (e) {
        console.error(`Exception raised during post-processing: ${e.stack}`);
    }
}

