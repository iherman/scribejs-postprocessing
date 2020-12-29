# Processing WG/IG minutes produced by scribejs

## Overview

This script is post-processing minutes that have been produced by [scribejs](https://github.com/w3c/scribejs). The goal is usually to extract information from the minutes that may make the life of Working Groups easier…

At this moment, there are two such post-processing steps: extract the resolutions into a separate file, and add a notice to each issue that was discussed during a call. See the details below.

The script has been developed in TypeScript; the “compiled” files are in the `./dist` directory. The script can be run by:

```
Usage: node dist/main.js [configuration_file]
```

Configuration files may come in two flavors:

- Configurations to handle minutes on a github repository, see a [documentation of the configuration type](https://iherman.github.io/scribejs-postprocessing/interfaces/_src_lib_types_.githubrepo.html) for the details;
- Configurations to handle minutes on a local repository clone (i.e., on the user's local file system), see the [documentation of the configuration type](https://iherman.github.io/scribejs-postprocessing/interfaces/_src_lib_types_.localrepo.html) for the details.

The (common) `local` flag in the configuration file indicates the choice between the two.

There are a number of [predefined configuration files](https://w3c.github.io/scribejs/BrowserView/Groups/) for some of the active Working Groups using this tool. See, for example, the [github repository configuration](https://w3c.github.io/scribejs/BrowserView/Groups/postprocessing/epub.json), respectively the [local close configuration](https://w3c.github.io/scribejs/BrowserView/Groups/postprocessing/epub_local.json), for the EPUB 3 Working Group.

The processing steps may depend on the metadata header (stored in JSON-LD) of the minute file. This means that the latest release (i.e., 2.0.0 or higher) of the [scribejs](https://github.com/w3c/scribejs) must be used to generate the minutes themselves.

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


---

Maintainer: [@iherman](https://github.com/iherman)
