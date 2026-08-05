# Import an existing deck

Move a talk you already have — PowerPoint, Google Slides, Slidev or reveal.js —
into SliDesk.

```sh
slidesk import deck.pptx -o my-talk
cd my-talk && slidesk
```

The import gives you the **content** of the deck as editable Markdown. The
original layout is not reproduced: you restyle it with a SliDesk theme, which is
usually the point of moving over.

## From PowerPoint

```sh
slidesk import deck.pptx -o my-talk
```

Titles, bullet lists with their nesting, tables, links, bold and italic, speaker
notes and embedded images are converted. Images land in `assets/` and are
referenced with `!image()`.

## From Google Slides

```sh
slidesk import "https://docs.google.com/presentation/d/ABC.../edit" -o my-talk
```

SliDesk downloads the PowerPoint export of the presentation, so the deck must be
shared with **anyone with the link**. If it is private, download it yourself
(File > Download > Microsoft PowerPoint) and import the `.pptx`.

## From Slidev

```sh
slidesk import slides.md -o my-talk       # or: slidesk import ./my-slidev-dir
```

Slides are split on `---`, headmatter gives the deck title, per-slide `layout`
and `class` become SliDesk classes, and a trailing `<!-- ... -->` becomes speaker
notes. Separators inside fenced code blocks are left alone.

Vue components (`<Tweet/>`, `v-click`, …) are copied as-is — they will not do
anything in SliDesk, remove them or replace them with a
[plugin](create-plugins).

## From reveal.js

```sh
slidesk import talk/index.html -o my-talk
```

Each `<section>` becomes a slide, vertical stacks are flattened into consecutive
slides, `data-markdown` sections keep their Markdown, and `<aside class="notes">`
becomes speaker notes. Image `src` paths are kept untouched, so copy your asset
folder next to the imported talk.

## After the import

The generated talk is a normal SliDesk talk:

```
my-talk/
├── main.md          # !include(slides)
├── slidesk.toml     # TITLE
├── slides/          # one file per slide, in order
└── assets/
```

Rework it slide by slide, add a [theme](create-themes), and use
[templates](use-templates) for the layouts you had in the original deck.

If the format is guessed wrong, force it:

```sh
slidesk import weird-file -t revealjs -o my-talk
```
