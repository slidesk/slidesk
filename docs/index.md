# SliDesk

![logo](_media/icon.svg){width=250}

SliDesk is a talk engine that turns Markdown into web-based presentations. Lightweight, extensible via plugins, themes, templates and components, and built with [Bun](https://bun.sh).

## Features

- **Markdown to slides** — each `##` heading creates a new slide
- **Live reload** — edit your slides, the browser updates instantly
- **Speaker view** — current + next slide, timer, notes, checkpoints
- **Telnet mode** — present from any terminal via telnet
- **Plugin system** — extend with front-end scripts, back-end routes, WebSocket handlers
- **Templates & themes** — reusable layouts and visual styles
- **Components** — custom `.mjs` modules that transform your slide HTML
- **Internationalisation** — multi-language presentations with `.lang.json`
- **Hub integration** — share and discover addons at [slidesk.link](https://slidesk.link)
- **Deploy** — export static HTML, or CI/CD for GitHub/GitLab Pages

## Quick start

```sh
# Install via Homebrew (macOS/Linux)
brew tap gouz/tools && brew install slidesk

# Create a new talk
slidesk create my-talk

# Present it
slidesk my-talk

# Open http://localhost:1337
```

See the [installation tutorial](tutorials/01-installation) for other install methods.

## Documentation

- [Tutorials](tutorials) — learn SliDesk step by step
- [How-to Guides](how-to) — solve specific tasks
- [Reference](reference) — commands, options, syntax, APIs
- [Explanation](explanation) — background and architecture
