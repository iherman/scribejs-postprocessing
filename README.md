# Processing WG/IG minutes produced by scribejs

This script is post-processing minutes that have been produced by [scribejs](https://github.com/w3c/scribejs). The goal is usually to extract information from the minutes that may make the life of Working Groups easier…

At this moment, there are two such post-processing steps: extract the resolutions into a separate file, and add a notice to each issue that was discussed during a call. See the details below.

The script is using `node.js`, and can be run by:

```
Usage: post-process [options] [configuration_file]
```

Configuration files may come in two flavors:

- Configurations to handle minutes on a github repository, see the [documentation of the configuration type](https://iherman.github.io/scribejs-postprocessing/interfaces/_src_lib_types_.githubrepo.html) for the details;
- Configurations to handle minutes on a local repository clone (i.e., on the user's local file system), see the [documentation of the configuration type](https://iherman.github.io/scribejs-postprocessing/interfaces/_src_lib_types_.localrepo.html) for the details.

The (common) `local` flag in the configuration file indicates the choice between the two.

There are a number of [predefined configuration files](https://w3c.github.io/scribejs/BrowserView/Groups/) for some of the active Working Groups using this tool.

## Extracting resolutions

The goal is to extract the resolutions from meeting minutes generated as markdown files by [scribejs](https://github.com/w3c/scribejs), and to create a JSON file in the repository (typically in the `assets` directory, but that can be configured) listing the resolutions and the pointers to the minutes.  An example for the generated JSON file is
[`assets/minute_processing.js`](https://github.com/iherman/scribejs-postprocessing/assets/minute_processing.js). Its structure is as follows:

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

The script avoids unnecessary network access by only generating the entries for _new_ (i.e., not yet processed) meetings; hence this file is stored in the group's repository. That file is updated at each run. The location of that file is part of the configuration.

The [`assets/minute_processing.js`](https://github.com/iherman/scribejs-postprocessing/assets/minute_processing.js) file can be used by a client-side script to display the list of resolutions. See, for example, the [`browser_view/resolutions.html`](https://github.com/iherman/scribejs-postprocessing/browser_view/resolutions.html) file, with the corresponding [`browser_view/resolution_view.js`]((https://github.com/iherman/scribejs-postprocessing/browser_view/resolutions.html)) script.

(The local `_minutes` and `_assets` directories in this repository are only for testing purposes. See also the [API documentation](https://iherman.github.io/scribejs-postprocessing/modules/_src_main_.html) for further details.)

## Extracting issue comments

[scribejs](https://github.com/w3c/scribejs) adds special “directives” into the minutes (relying on a scribe feature) when a section (or subsection) discusses specific issues or pull requests. These directives are of the form:

```
<!-- scribe owner/repo/issuenumbers owner/repo/issuenumber2 -->
```

The post-processing steps extracts the (sub)sections that contain these directives, creates a notice referring to the minutes, and the possible resolutions, and finally adds a comment to the issue. This, effectively, “binds” the WG discussions to the issues and vice versa. configuration file contains a separate flag to switch this behavior on and off for each repository (some WG-s do not systematically separate the issues into subsections, which would make this processing step meaningless…)

---

Maintainer: [@iherman](https://github.com/iherman)
