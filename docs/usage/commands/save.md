# Save your talk

The `save` command exports your presentation as a standalone static HTML site, ready for hosting on any static file server.

```sh
slidesk save -t public mytalk
```

The `-t` / `--target` option specifies the output directory:

```
  -t, --target <path>        save the presentation
```

## Output structure

Running the command above generates a `public/` directory:

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

You can deploy the output directory to any static host:

```sh
# Serve locally for testing
npx serve public

# Or upload to any web server, GitHub Pages, Netlify, etc.
```

## Save with speaker notes

To also export the speaker notes view:

```sh
slidesk save -t public -n mytalk
```
