# theme

```
  -T, --theme <param>      use only this theme, when the talk has several
```

Available on `present`, `export` and `save`.

By default, every theme in `themes/` is loaded. With several themes, pick the one to present with:

```sh
slidesk -T dark my-talk
slidesk export -T dark my-talk
slidesk save -T dark my-talk
```

Only `themes/dark/` is then used: its styles, scripts, templates, components, plugins and translations. Files placed directly in `themes/`, outside a theme directory, are left out too. With `save`, the other themes are not copied to the target directory either. When `themes/dark/` does not exist, the command stops and lists the themes it found.

## Without `--theme`

All the themes are loaded together, and where they overlap:

- **styles**: every stylesheet is included, so the rule loaded last wins;
- **templates**: a template with the same name in two themes is overwritten by the one read last;
- **translations**: themes are merged in alphabetical order, so a key of `themes/light/` wins over the same key of `themes/dark/`, and the talk always has the last word (see [translations of a theme](../syntax/internationalisation.md#translations-of-a-theme));
- **components and plugins**: those of every theme are loaded.

To avoid depending on this order, keep a single theme in the talk or present with `--theme`.
