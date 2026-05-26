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

## Installation

Choose your method:

- **Homebrew** (macOS/Linux):
  ```sh
  brew tap gouz/tools && brew install slidesk
  ```

- **Bun** (any platform):
  ```sh
  bunx slidesk
  ```

- **Debian/Ubuntu** — download the `.deb` from the [releases page](https://github.com/slidesk/slidesk/releases).

- **Docker**:
  ```sh
  docker run -it -v "$(pwd)"/:/slidesk/ -p 1337:1337 gouz/slidesk:latest slidesk
  ```

## Quick start

```sh
# Create a new talk
slidesk create my-talk

# Present it
slidesk my-talk

# Open http://localhost:1337
```

## Write slides

Slides are written in Markdown. Each `## ` heading starts a new slide.

```markdown
## First Slide

# My Talk

Welcome to SliDesk!

## Second Slide

- Bullet points
- Work as expected

!image(image.jpg)
```

See the [full syntax guide](syntax/) for details.

## Present

```sh
slidesk my-talk
```

Open http://localhost:1337 in your browser.

While running, use the terminal to navigate:
- **Enter** — next slide
- **P + Enter** — previous slide
- **Q** — quit

Add speaker notes: `slidesk my-talk -n` (opens `notes.html`).

## Next steps

- [Configuration guide](configuration/) — customize ports, HTTPS, transitions, domain
- [Plugins & addons](addons/) — extend SliDesk with extras
- [Usage & commands](usage/) — all CLI subcommands and options
- [Deploy](deploy/) — export a standalone HTML bundle or CI/CD
