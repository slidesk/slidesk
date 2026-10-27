<p align="center">
  <img alt="SliDesk" src="https://raw.githubusercontent.com/slidesk/slidesk/main/docs/_media/icon.svg" width="160" />
</p>

<h1 align="center">SliDesk</h1>

<p align="center">
  <b>Markdown slides with native translations and file includes.<br/>One binary, no Vue project, no build step.</b>
</p>

<p align="center">
  <a href="https://slidesk.github.io/slidesk/demo/"><b>Live demo</b></a> ·
  <a href="https://slidesk.github.io/slidesk/">Documentation</a> ·
  <a href="https://github.com/slidesk/talk-slidesk">Example talk</a> ·
  <a href="https://slidesk.link">Addons hub</a> ·
  <a href="https://github.com/slidesk/slidesk/releases">Releases</a>
</p>

<p align="center">
  <img alt="A SliDesk talk: Markdown slides, then an edit that reloads live" src="https://raw.githubusercontent.com/slidesk/slidesk/main/docs/_media/demo.gif" width="720" />
</p>

---

Write your talk in Markdown, present it in the browser with a speaker view on your phone, and export it to PDF or PowerPoint. SliDesk is a single [Bun](https://bun.sh) binary: there is no `node_modules`, no front-end app to maintain, and nothing to configure before your first slide.

```markdown
# My talk

## Hello 👋

Each `##` starts a slide.

/*
Speaker notes, only visible in the speaker view.
*/

## Agenda .[#split]

!include(slides)
```

```sh
slidesk my-talk          # present at http://localhost:1337, with live reload
slidesk -l fr my-talk    # the same talk, in French
slidesk export my-talk   # my-talk.pdf (or -t pptx)
```

## Why SliDesk

- **One talk, many languages.** Slides hold `$$variables$$`, the words live in `en.lang.json`, `fr.lang.json`… and `--lang` picks one. No duplicated deck to keep in sync.
- **Includes.** Split a talk across files and directories with a single `!include(slides)`.
- **A real speaker view.** Current and next slide, notes, timers and checkpoints, drivable from your phone with a QR code, and only by you.
- **Bring your existing decks.** `slidesk import` turns a PowerPoint, Google Slides, Slidev or reveal.js deck into a SliDesk talk.
- **Share it everywhere.** Export to PDF or PPTX, save a static site for GitHub or GitLab Pages, or host it on [slidesk.link](https://slidesk.link) in one command.
- **Present from a terminal.** `--telnet` serves a text version of your talk. Yes, really.
- **Extensible.** Themes, templates, components and plugins, shared on the [hub](https://slidesk.link).

| | Marp | Slidev | reveal.js | Typst | SliDesk |
| --- | --- | --- | --- | --- | --- |
| Authoring format | Markdown | Markdown + Vue | HTML / Markdown | Typst markup | Markdown |
| Install footprint | Node / CLI | Node project | Node project | single binary | **single binary** |
| Multi-language from one source | ✗ | ✗ | ✗ | ✗ (scriptable) | ✅ |
| Directory includes | ✗ | per file | per section | per file | ✅ |
| Speaker view with timers | limited | ✅ | ✅ | via pdfpc | ✅ |
| Import PowerPoint / Slidev / reveal.js | ✗ | ✗ | ✗ | ✗ | ✅ |
| Present from a terminal | ✗ | ✗ | ✗ | ✗ | ✅ |

More in [Why SliDesk?](https://slidesk.github.io/slidesk/explanation/why-slidesk/)

## Install

```sh
brew install gouz/tools/slidesk   # macOS / Linux
bunx slidesk                      # anywhere Bun runs
```

Windows (`slidesk_windows.zip`), Linux and macOS binaries and a `.deb` package are attached to every [release](https://github.com/slidesk/slidesk/releases), and a Docker image is on Docker Hub as [`gouz/slidesk`](https://hub.docker.com/r/gouz/slidesk). See the [installation guide](https://slidesk.github.io/slidesk/tutorials/01-installation/).

## Get started

```sh
slidesk create my-talk   # scaffold a talk
slidesk my-talk          # present it, edits reload live
```

Then follow the [tutorial](https://slidesk.github.io/slidesk/tutorials/), or ask your AI assistant: `slidesk skills` adds the SliDesk skills for Claude Code to your project.

## Going further

- [VS Code extension](https://github.com/slidesk/vscode-sdf-language) for the `.sdf` syntax
- [Plugins and components](https://github.com/slidesk/slidesk-extras), and the [hub](https://slidesk.link) to share yours
- [Contributing](CONTRIBUTING.md) — issues and pull requests are welcome

## License

[MIT](LICENSE)
