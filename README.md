# Extract WG resolutions

The goal is to extract the resolutions from meeting minutes generated as markdown files by [scribejs](https://github.com/w3c/scribejs), and to create a JSON file in the repository (typically in the `assets` directory, but that can be configured) listing the resolutions and the pointers to the minutes. This is done by the

```
node dist/main.js
```

command, using the list of repositories in [`src/lib/config.ts`](https://github.com/iherman/scribejs-resolutions/src/lib/config.ts). An example for the generated JSON file is
[`assets/resolutions.js`](https://github.com/iherman/scribejs-resolutions/assets/resolutions.js). Its structure is as follows:

```text
{
    "date" : // Date of the last generation,
    "short_names" : [
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

The script avoids unnecessary network access by only generating the entries for _new_ (i.e., not yet processed) meetings.

The [`assets/resolutions.js`](https://github.com/iherman/scribejs-resolutions/assets/resolutions.js) file can be used by a client-side script to display the list of resolutions. See, for example, the [`browser_view/resolutions.html`](https://github.com/iherman/scribejs-resolutions/browser_view/resolutions.html) file, with the corresponding [`browser_view/resolution_view.js`]((https://github.com/iherman/scribejs-resolutions/browser_view/resolutions.html)) script.

(The local `_minutes` and `_assets` directories in the repository are only for testing purposes. See also the [API documentation](https://iherman.github.io/scribejs-resolutions/modules/_src_main_.html) for further details.)

---

Maintainer: [@iherman](https://github.com/iherman)
