# Your first presentation

## Create a new talk

```sh
slidesk create my-talk
```

SliDesk will ask you for a title and whether you want a custom CSS file. It generates this structure:

```
my-talk/
├── main.md            # your slides in Markdown
├── slidesk.toml       # optional configuration
├── custom.css         # optional styling
├── slides/            # slide fragments (via !include)
├── themes/
│   └── default/
│       └── theme.css
└── templates/         # .sdt template files
```

## Write slides

Open `main.md`. Each `##` heading starts a new slide.

```markdown
# My Talk Title

## Introduction

Welcome to SliDesk!

## Agenda

1. Part one
2. Part two
3. Part three
```

## Present your talk

```sh
slidesk my-talk
```

Open http://localhost:1337 in your browser.

## Navigate

While running, the terminal lets you control the presentation:

- **Enter** — next slide
- **P + Enter** — previous slide
- **Q** — quit
- Type a **number** — jump to that slide

In the browser, use arrow keys, swipe gestures, or **f** for fullscreen.

## What's next?

Now that you can present, learn how to [add images, templates, and speaker notes](03-adding-content.md).
