# Export a static site

Export your presentation as standalone static HTML for hosting anywhere.

```sh
slidesk save -t public my-talk
```

The `-t` / `--target` option specifies the output directory.

## Output structure

```
public/
├── index.html         # the full presentation
├── slidesk.css        # presentation styles
├── slidesk.js         # presentation scripts
├── notes.html         # speaker notes view (if -n was used)
├── notes.js
├── notes.css
├── manifest.json      # PWA manifest
├── favicon.svg        # favicon
└── <assets>           # copied from your talk directory
```

## Serve locally

```sh
npx serve public
```

## Include speaker notes

```sh
slidesk save -t public -n my-talk
```
