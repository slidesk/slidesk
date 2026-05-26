# SliDesk

![logo](_media/icon.svg){width=250}

SliDesk is a talk engine that turns Markdown into web-based presentations. Lightweight, extensible via plugins, and built with [Bun](https://bun.sh).

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

## Create a presentation

```sh
slidesk create my-talk
```

SliDesk will ask for a title and optionally generate a `custom.css`. This creates a `my-talk/` directory containing a `main.md` file.

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

- [Configuration guide](configuration/) — customize ports, HTTPS, transitions
- [Plugins](addons/) — extend SliDesk with extras
- [Deploy](deploy/) — export a standalone HTML bundle
