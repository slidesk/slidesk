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

Exporting needs a Chromium-based browser: SliDesk starts it headless and drives
it over the DevTools Protocol. Chrome, Chromium, Edge, Brave and Vivaldi are
found automatically. Nothing is downloaded and no extra dependency is installed.

If your browser lives somewhere unusual — or in CI:

```sh
SLIDESK_CHROME=/usr/bin/chromium slidesk export my-talk
```

In a GitHub Actions job:

```yaml
- run: sudo apt-get install -y chromium-browser
- run: bunx slidesk export -t pdf my-talk
```

## PDF or PPTX?

| | pdf | pptx |
|---|---|---|
| Slide rendering | vectorial | 1920x1080 image |
| Selectable text | yes | no |
| Speaker notes | no | yes |
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

Both formats walk the deck slide by slide, so plugin `onSlideChange` hooks run
for every slide and whatever they render ends up in the export. What gets lost:

- transitions between slides are dropped,
- step-by-step reveals (`@gouz/steps`) are captured at their first step, not
  unrolled into one page per step,
- anything driven by interaction is frozen in its initial state.

One case the PDF cannot cover: a slide holding an `<iframe>` keeps the frame it
loaded and is never rebuilt, because an iframe re-created at print time would
come out blank. If a plugin renders into such a slide *and* tears it down when
you leave, only the last visited one keeps its content. Export that deck as
PPTX, which captures every slide while it is on screen.

## Speaker notes

Your `/* ... */` notes land in the notes pane of the PPTX, one PowerPoint note
per slide — slides without notes get none. Notes are exported as plain text:
formatting is dropped, list items keep a `•` marker, and blank lines are
preserved.

The PDF carries no notes: use the speaker view (`slidesk -n`) to present with
them.
