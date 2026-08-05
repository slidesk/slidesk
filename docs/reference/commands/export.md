# export

Export your presentation as a PDF or a PPTX file.

```sh
slidesk export mytalk               # mytalk.pdf
slidesk export -t pptx mytalk       # mytalk.pptx
slidesk export -o slides.pdf mytalk
```

## Options

```
  -t, --type <format>        pdf or pptx (default: "pdf")
  -o, --output <file>        output file (default: the slugified title of your talk)
  -c, --conf <file>          custom slidesk.toml path
  -l, --lang <code>          language version
```

## Requirements

Exporting renders your slides in a headless Chromium. SliDesk drives an already
installed browser over the DevTools Protocol — nothing is downloaded. Chrome,
Chromium, Edge, Brave and Vivaldi are detected automatically; set
`SLIDESK_CHROME` (or `CHROME_PATH`) to point at a specific binary:

```sh
SLIDESK_CHROME=/usr/bin/chromium slidesk export mytalk
```

## What you get

Slides are rendered at **1920x1080**.

- **pdf** — one page per slide, printed vectorially: text stays selectable and
  searchable, and the file stays small.
- **pptx** — one PowerPoint slide per slide, each holding a full-bleed 1920x1080
  capture of the rendered slide. Your `/* ... */` speaker notes are exported as
  plain text into the PowerPoint notes pane.

Both formats visit the slides one after the other, exactly like presenting: each
slide is captured as it renders when you land on it, so plugin `onSlideChange`
hooks fire and the elements they inject are exported too. Transitions are
dropped and step-by-step reveals are not unrolled into extra pages.

A slide is captured once the `TRANSITION` delay (300 ms by default) has elapsed;
raise it in `slidesk.toml` if a plugin needs longer to draw.

The PDF is printed in one go at the end, so a slide is snapshotted while it is
current and put back just before printing — plugins that tear down their output
when you leave a slide (abcjs drops its score, xterm its terminal) still export
correctly. A slide is only put back if it actually changed, and never if it
holds an `<iframe>`, whose loaded document cannot be re-created.
