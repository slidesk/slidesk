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

Sources are left out of the export: `.sdf`, `.md` and `.sdt` files, `plugin.json`, `.lang.json` files, `link.yml`, and the `components/` directories, whose output is already in the HTML.

So are the files that must stay on your machine, since a deploy publishes the export: hidden files and directories (`.git`, `.env`, `.npmrc`, `.github`…), `.toml`, `.pem` and `.key` files, and the `KEY` and `CERT` files of the configuration. `present` does not serve them either.
