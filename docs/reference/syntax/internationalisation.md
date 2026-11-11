# Internationalisation

Create `XX.lang.json` files for multi-language support:

```json
{
  "default": true,
  "translations": {
    "myVar": "My variable"
  }
}
```

In your slides, use `$$myVar$$` to reference a translation. Switch language with the `--lang` option:

```sh
slidesk -l fr my-talk
```

## Translations of a theme

A theme translates its own elements with its own `XX.lang.json` files, in its directory:

```
my-talk/
├── main.sdf
├── en.lang.json
├── fr.lang.json
└── themes/
    └── my-theme/
        ├── en.lang.json
        ├── fr.lang.json
        └── templates/
```

The `$$key$$` of the theme's templates are translated in the language of the talk: the one given with `--lang`, or else the `default` one of the talk. When the theme does not have that language, it uses its own `default` file.

The talk has the last word: a key defined both by the talk and by its theme takes the talk's translation.

`--lang` accepts the languages of the talk and of its themes.

