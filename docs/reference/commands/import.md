# import

Turn an existing deck into a SliDesk talk.

```sh
slidesk import deck.pptx                        # -> ./<slugified title>/
slidesk import slides.md -o my-talk             # slidev
slidesk import talk/index.html -o my-talk       # reveal.js
slidesk import https://docs.google.com/presentation/d/ABC/edit
```

## Options

```
  -t, --type <format>        pptx, gslides, slidev or revealjs (default: guessed)
  -o, --output <dir>         target directory (default: the slugified deck title)
  -f, --force                write even if the target directory is not empty
```

## Source

`source` is a file, a directory or a URL.

- A **directory** is searched for `slides.md`, `index.html`, `slides.html` then
  `main.md`.
- A **URL** on `docs.google.com/presentation` is downloaded as pptx; any other
  URL is fetched and read as reveal.js.
- Otherwise the format is guessed from the extension, then from the content.
  Force it with `-t` when the guess is wrong.

## Output

```
my-talk/
├── main.md          # !include(slides), no extra cover slide
├── slidesk.toml     # TITLE taken from the source deck
├── slides/
│   ├── 01-intro.md
│   └── 02-le-probleme.md
└── assets/          # images pulled out of the pptx
```

One file per source slide, numbered in order and named after the slide title.
Each file is a single `##` slide, with source classes in `.[...]` and speaker
notes in `/* ... */`.

## What is converted

| | pptx / gslides | slidev | reveal.js |
|---|---|---|---|
| Titles | title placeholders | first heading | first heading |
| Bullets | with their levels | as written | `ul` / `ol` |
| Tables | yes | as written | `table` |
| Images | extracted to `assets/` | paths kept | paths kept |
| Speaker notes | notes pane | trailing `<!-- -->` | `aside.notes` |
| Classes | — | `layout` and `class` | `class` of the section |

Headings above level 3 are demoted inside a slide: a `##` line would otherwise
start a new SliDesk slide.

## What is not converted

Layout is not: an import gives you the **content** of the deck, to restyle with
a SliDesk theme. Shapes, diagrams, charts, SmartArt, colours, animations and
transitions are dropped. Slidev Vue components and reveal.js fragments are left
in place as raw markup for you to clean up.
