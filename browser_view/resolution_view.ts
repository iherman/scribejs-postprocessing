/**
 * Data describing a single resolution
 */
interface Resolution {
    /**
     * Year of the resolution
     */
    year: number;

    /**
     * Date of the resolution (in ISO format)
     */
    date: string;

    /**
     * "Number" of the resolution (resolutions are numbered for a single call)
     */
    number: number;

    /**
     * Text of the resolution; this is an HTML fragment
     */
    text: string;

    /**
     * URL for the resolution (ie, the URL of the minutes with the relevant fragment ID)
     */
    url: string;

    /**
     * The short name of the Group's call. This corresponds, usually, to the IRC channel name
     * used for the call.
     * 
     */
    call: string;
}

/**
 * The collection of all the Resolutions, as stored as an asset on the repository
 */
interface Resolutions_Structure {
    /**
     * List of minutes that have been processed (the items are simply the base names of the full URLs or path names)
     */
    short_names: string[];

    /**
     * List of all the resolutions
     */
    resolutions: Resolution[];

    /**
     * Date of the generation of the current resolution list
     */
    date?:       string;    
}


const REMOTE_YEAR: number = 3000;

async function display_resolutions(target_id: string, resolution_asset: string, header_level: number, call: string = null) {
    /**
     * Compare resolution objects; to be used in a “sort” method on the array of Resolutions.
     * 
     * Sorting takes a decreasing order by year, a decreasing order by meeting date within a year, and finally an increasing order by resolution number
     *  
     * @param  a - Left operand 
     * @param  b - Right operand
     * @returns - negative, zero, or positive, depending on the comparison result (see the Javascript “sort” method for details) 
     */
    const sort_resolutions = (a: Resolution, b: Resolution): number => {
        if (a.year === b.year) {
            if (a.date === b.date) {
                return a.number - b.number;
            } else if (a.date < b.date) {
                return 1;
            } else {
                return -1;
            }
        } else {
            return b.year - a.year;
        }
    }

    /*
    * Generate the HTML listing of all the resolutions
    */
    const retrieve_html = (resolutions: Resolution[]): string => {
        let retval: string = '';
        // y2k problem for the future:-)
        let year: number   = REMOTE_YEAR;
        if (resolutions.length === 0) {
            return `${retval}`;
        } else {
            resolutions.forEach((resolution: Resolution): void => {
                if (resolution.year < year) {
                    // Close the previous list if there was any
                    if (year !== REMOTE_YEAR) {
                        retval = `${retval}</ul>\n`
                    }
                    retval = `${retval}\n<h${header_level}>${resolution.year}</h${header_level}>\n<ul>\n`
                    year = resolution.year;
                }
                retval = `${retval}<li><a href="${resolution.url}">Resolution #${resolution.number} on ${resolution.date}</a>: ${resolution.text}</li>\n`;
            });
            return `${retval}</ul>\n</div>`;    
        }
    }

    const target: HTMLElement   = document.getElementById(target_id);
    const resolution_structures: Resolutions_Structure = (await (await fetch(resolution_asset)).json()) as Resolutions_Structure;
    const resolutions: Resolution[] = (call !== null) ? resolution_structures.resolutions.filter((resolution: Resolution): boolean => resolution.call === call) : resolution_structures.resolutions;
 
    target.innerHTML = retrieve_html(resolutions.sort(sort_resolutions));
}
