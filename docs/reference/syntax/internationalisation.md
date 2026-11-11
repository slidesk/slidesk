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

Speaker notes are translated too: a `$$myVar$$` between `/*` and `*/` follows the language of the slides.

## Formatting in a translation

A sentence is translated as a whole, since the order of the words changes from one language to another. Its formatting is part of the translation: bold, italic, inline code and links are written in Markdown in the value.

`en.lang.json`:

```json
{
  "translations": {
    "intro": "Install it with `brew`, it takes **one minute**: see [the guide](https://slidesk.github.io/slidesk/)"
  }
}
```

`fr.lang.json`:

```json
{
  "translations": {
    "intro": "Une **minute** suffit pour l'installer avec `brew` : voir [le guide](https://slidesk.github.io/slidesk/)"
  }
}
```

Only inline Markdown is rendered: a value that would become a list, a heading or several paragraphs (`1. Introduction`, `# Title`) is inserted as written. HTML in a value is kept.

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

The talk has the last word: a key defined both by the talk and by its theme takes the talk's translation. The keys of a theme are available to the slides and the speaker notes of the talk too.

`--lang` accepts the languages of the talk and of its themes.
