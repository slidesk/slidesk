# Export to PDF or PPTX

Hand out your deck, upload it to a conference platform, or drop it into a
PowerPoint agenda.

```sh
slidesk export my-talk               # my-talk.pdf
slidesk export -t pptx my-talk       # my-talk.pptx
```

The output file is named after the `TITLE` of your `slidesk.toml` (slugified),
or after the talk directory. Override it with `-o`:

```sh
slidesk export -o build/deck.pdf my-talk
```

## Install a browser

Exporting needs a Chromium-based browser: SliDesk starts it headless through
`Bun.WebView` and drives it over the DevTools Protocol. Chrome, Chromium, Edge,
Brave and Vivaldi are found automatically. Nothing is downloaded and no extra
dependency is installed.

Without one, the lightest to install is `chrome-headless-shell`, found
automatically too:

```sh
bunx playwright install chromium-headless-shell
```

On macOS, nothing is needed: without a Chromium, SliDesk exports with the WebKit
of the system. The PPTX is the same, but each page of the PDF is then an image,
without selectable text, links or bookmarks.

If your browser lives somewhere unusual — or in CI:

```sh
SLIDESK_CHROME=/usr/bin/chromium slidesk export my-talk
```

In a GitHub Actions job:

```yaml
- run: bunx playwright install chromium-headless-shell
- run: bunx slidesk export -t pdf my-talk
```

## PDF or PPTX?

| | pdf | pptx |
|---|---|---|
| Slide rendering | vectorial | 1920x1080 image |
| Selectable text | yes | no |
| Speaker notes | with `--notes`, as pages | yes, in the notes pane |
| Bookmarks | one per slide | no |
| File size | small | a few MB |
| Editable afterwards | no | slide order and notes |

Pick **pdf** to share or archive a deck, **pptx** when someone asks for
"the PowerPoint".

## Language versions

Export the version you need with `-l`, like when presenting:

```sh
slidesk export -l fr my-talk -o deck-fr.pdf
slidesk export -l en my-talk -o deck-en.pdf
```

## What does not survive the export

Both formats walk the deck like a speaker pressing "next", so plugin
`onSlideChange` hooks run for every slide and whatever they render ends up in
the export. Step-by-step reveals (`@gouz/steps`, `@gouz/sbs`) are unrolled: one
page per revealed item. What gets lost:

- transitions between slides are dropped,
- anything driven by interaction is frozen in its initial state.

One case the PDF cannot cover: a slide holding an `<iframe>` keeps the frame it
loaded and is never rebuilt, because an iframe re-created at print time would
come out blank. If a plugin renders into such a slide *and* tears it down when
you leave, only the last visited one keeps its content. Export that deck as
PPTX, which captures every slide while it is on screen.

## Speaker notes

Your `/* ... */` notes land in the notes pane of the PPTX, one PowerPoint note
per slide, repeated on each of its steps — slides without notes get none. Notes are exported as plain text:
formatting is dropped, list items keep a `•` marker, and blank lines are
preserved.

The PDF carries them with `--notes`: after the last step of each slide comes a
page with its notes, formatting kept, on as many pages as they need. Slides
without notes get no extra page.

```sh
slidesk export -n my-talk
```
