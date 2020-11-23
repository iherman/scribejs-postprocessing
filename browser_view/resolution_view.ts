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
interface MinuteProcessing {
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
    date?: string;    
}


const REMOTE_YEAR    = 3000;

const Ms_a_day: number          = 1000*60*60*24;
const PROVISIONAL_LIMIT = 7;

/**
*   Get the number of days between two dates - not inclusive.
*
*   "between" does not include the start date, so days
*   between Thursday and Friday is one, Thursday to Saturday
*   is two, and so on. Between Friday and the following Friday is 7.
*
*   e.g. getDaysBetweenDates( 22-Jul-2011, 29-jul-2011) => 7.
*
*   If want inclusive dates (e.g. leave from 1/1/2011 to 30/1/2011),
*   use date prior to start date (i.e. 31/12/2010 to 30/1/2011).
*
*   Only calculates whole days.
*
* Credit to https://stackoverflow.com/users/7204614/ben-h, see [relevant stack overflow question](https://stackoverflow.com/questions/7763327/how-to-calculate-date-difference-in-javascript#7763335).
*
*   Assumes d0 <= d1
* 
* @param d0 - older date value
* @param d1 - newer date value
*/
const getDaysBetweenDates = (d0: Date, d1: Date): number => {
    // Copy dates so don't mess them up
    const x0 = new Date(d0);
    const x1 = new Date(d1);
  
    // Set to noon - avoid DST errors
    x0.setHours(12,0,0);
    x1.setHours(12,0,0);
  
    // Round to remove daylight saving errors
    return Math.round( (x1.valueOf() - x0.valueOf()) / Ms_a_day );
}

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

/**
 * Display the resolutions in a list.
 * 
 * @param target_id - the div element’s ID that should include the full list
 * @param resolution_asset - the (relative) URL of the resolution asset file
 * @param header_level - the header level (i.e., the number in the `<hx>` element to be used for the years)
 * @param check_provisional - check whether a resolution is to be checked against the 7 days limit
 * @param call - the type of call (as stored in the [[Resolution]] object) to filter the resolutions (important if task force calls have their own calls and resolutions)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function display_resolutions(target_id: string, resolution_asset: string, header_level: number, check_provisional = true, call: string = null) {
    const today: Date = new Date();
    /*
    * Generate the HTML listing of all the resolutions
    */
    const retrieve_html = (resolutions: Resolution[]): string => {
        let retval = '';
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
                // See if the resolution is final or still provisional
                const res_date: Date = new Date(resolution.date);
                retval = `${retval}<li><a href="${resolution.url}">Resolution #${resolution.number} on ${resolution.date}</a>: ${resolution.text}`;
                if (check_provisional && getDaysBetweenDates(res_date, today) < PROVISIONAL_LIMIT) {
                    retval = `${retval} <span class='provisional'>(Provisional)</span>`;
                }
                retval = `${retval}</li>\n`;
            });
            return `${retval}</ul>\n</div>`;    
        }
    }

    const target: HTMLElement   = document.getElementById(target_id);
    const resolution_structures: MinuteProcessing = (await (await fetch(resolution_asset)).json()) as MinuteProcessing;
    // eslint-disable-next-line max-len
    const resolutions: Resolution[] = (call !== null) ? resolution_structures.resolutions.filter((resolution: Resolution): boolean => resolution.call === call) : resolution_structures.resolutions;
 
    target.innerHTML = retrieve_html(resolutions.sort(sort_resolutions));
}
