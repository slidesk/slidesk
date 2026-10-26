# save

Export your presentation as a standalone static HTML site.

```sh
slidesk save -t public mytalk
```

## Options

```
  -t, --target <path>        output directory (default: "public")
  -c, --conf <file>          custom slidesk.toml path
  -l, --lang <code>          language version
```

The target directory is emptied before the export. To protect your files, `save` refuses a target that is your talk or one of its parent directories, and an existing directory that is not empty and holds no `index.html` (i.e. is not a previous export).

Sources are left out of the export: `.sdf`, `.md`, `.sdt` and `.toml` files, `plugin.json`, `.env` and `.lang.json` files, and the `components/` directories, whose output is already in the HTML.
