# Processing WG/IG minutes produced by scribejs

## Overview

This script is post-processing minutes that have been produced by [scribejs](https://github.com/w3c/scribejs). The goal is usually to extract information from the minutes that may make the life of Working Groups easier…

At this moment, there are two such post-processing steps: extract the resolutions into a separate file, and add a notice to each issue that was discussed during a call. See the details below.

The script has been developed in TypeScript; the “compiled” files are in the `./dist` directory. The script can be run by:

```
Usage: node dist/main.js [configuration_file]
```

The configuration files are shared with the ones used by [scribejs](https://github.com/w3c/scribejs) to avoid repeating the data, although many of the data in the configuration file is therefore ignored by the post-processing steps. See the [description configuration](https://w3c.github.io/scribejs/configuration.html) for more details.

The script avoids unnecessary GitHub access, and duplication of data or issues, by looking at a specific file (whose location is in the configuration file) that lists the minutes already “processed”. That JSON file is of the form:

```text
{
    "date" : // Date of the last generation,
    "file_names" : [
        // Array of the file names for the minutes that have already been processed
    ],
    // other types of data
}
```

and is updated at each run after adding the new minutes that have been processed, if applicable. An example for the generated JSON file is [on the EPUB WG’s site](https://www.w3.org//publishing/groups/epub-wg/assets/minute_processing.json).

## Different post-processing steps

### Extracting resolutions

[scribejs](https://github.com/w3c/scribejs) adds the references to resolutions accepted during the call into the JSON-LD metadata. This steps extracts these data and adds them to the generated processing file (see the example above). The resulting file structure is as follows:

```text
{
    "date" : // Date of the last generation,
    "file_names" : [
        // Array of the file names for the minutes that have already been processed
    ],
    "resolutions" : [
        {
            "year"   : // year of the meeting,
            "date"   : // date of the meeting,
            "number" : // index of the resolution for that meeting
            "text"   : // text of the resolution, formatted in HTML
            "url"    : // pointer to the minutes where the resolution was discussed
            "call"   : // the name, i.e., the IRC channel name, for that meeting
        }
        ... // etc. (and entry for each resolution)
    ]
}
```

The resulting file can be used by a client-side script to display the list of resolutions. See, for example, the [EPUB WG deployment](https://www.w3.org/publishing/groups/epub-wg/Meetings/Minutes/resolutions), which uses the [client-side script](https://github.com/w3c/scribejs/blob/master/BrowserView/js/scribejs.js) generated from the separate [Typescript module](https://github.com/w3c/scribejs/tree/master/BrowserView/lib) in this repository.

### Extracting and processing actions

[scribejs](https://github.com/w3c/scribejs) adds the references to actions raised on the call into the JSON-LD metadata. This step extracts those actions and raises special issues on GitHub (the information stored in the metadata includes the reference to the GitHub repository).  

The configuration file contains a separate flag to switch this behavior on and off for each repository.

### Extracting and processing issue comments

[scribejs](https://github.com/w3c/scribejs) adds special “directives” into the minutes (relying on a scribe feature) when a section (or subsection) discusses specific issues or pull requests. These directives are of the form:

```
<!-- scribe owner/repo/issuenumbers owner/repo/issuenumber2 -->
```

The post-processing steps extracts the (sub)sections that contain these directives, creates a notice referring to the minutes, and the possible resolutions, and finally adds a comment to the issue on GitHub. This, effectively, “binds” the WG discussions to the issues and vice versa. The configuration file contains a separate flag to switch this behavior on and off for each repository (some WG-s do not systematically separate the issues into subsections, which would make this processing step meaningless…).

### Sending a notification mail to the group's public mailing list

This post-processing step should be invoked using the `-m` flag, with a possible `-d date` (in ISO format; defaults to today's date). To avoid spamming mailing lists, this option means that _only the email action is executed_.

---

Maintainer: [@iherman](https://github.com/iherman)
