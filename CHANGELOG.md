# Changelog

All notable changes to SliDesk. Each release on GitHub takes its notes from the matching section below.

## Unreleased

### 🐛 Fixes

- A fenced code block is shown as written: a `## ` inside it no longer starts a new slide, and `!include(...)`, `/* notes */` and `!image(...)` inside it are no longer run (showing SliDesk syntax on a slide broke the slide or the build).
- A talk given as an absolute path, or outside the working directory (`../talk`), works with every command: `present` and `export` did not find it, and `save` dropped its included slides.

## 2.20.1

### ⚠️ Behaviour changes

- `save` and `link host` follow the `[slidesk]` section of `slidesk.toml` again (title, transition, `COMMON_DIR`…): since 2.16.0, exported and hosted talks ignored it.
- A `--conf` file that does not exist, an invalid `slidesk.toml` and a `--lang` without its `.lang.json` are errors (exit code 1), instead of being silently ignored.
- A `++KEY++` missing from the configuration stays visible on the slide, with a warning, instead of disappearing.

### 🔒 Security

- `import` refuses an archive that expands beyond 500 MB: a 1 MB crafted `.pptx` used to take 2 GB of memory.
- `import` keeps only the file name of a `.pptx` media, so a crafted name cannot write outside the talk on Windows.
- Websocket messages only call functions defined on `window.slidesk`.

### 🐛 Fixes

- **Windows**: talks saved with CRLF line endings no longer merge an included slide into the previous one.
- `++KEY++` variables: a line with two `++` that are not a variable (`C++ vs C++`, `i++; j++` in code) lost the text between them.
- `present --telnet` crashed the whole talk when `HTTPS` was on; the telnet version now follows each rebuild too, and prints a TLS client command when `KEY` / `CERT` are set, since a plain `telnet` cannot connect then.
- A page that cannot reach its websocket (an export served over http, or a page left open after `present` quit) no longer polls every 5 ms forever: each slide change used to add three endless loops.
- Pages reconnect when `present` is restarted, and reload to show the new build.
- `present` reads `slidesk.toml` again on every change: editing the title, the transition or the timers no longer needs a restart.
- `COMMON_DIR` works as an absolute path, as documented; the files of its plugins (`addHTMLFromFiles`, `addRoutes`, `addWS`) are looked up in it, and `save` exports its files and plugins, which were missing.
- The PDF export no longer adds pages after the slides for the html that plugins inject.
- An invalid `slidesk.toml` is reported in one line naming the file, instead of a stack trace.
- An `!image(...)` whose file does not exist is reported with a warning instead of becoming a broken image without notice.

### 🧰 Internals

- The smoke tests drive a headless browser too (an exported page served over http, a page left open while `present` restarts) and count the pages of a PDF export.
- A flaky watcher test is stabilized, and the plugin loaders no longer import each other.

## 2.20.0

### ⚠️ Behaviour changes

- A command that fails now prints why and **exits with code 1** (it used to exit with 0 in many cases): unknown addon, unreachable hub, broken talk, existing deploy file…
- `save`, `export` and `link host` **fail on a broken talk** (missing or looping `!include`, …) instead of producing an "ERROR" presentation. `present` still shows that page while you fix the talk.
- `save` refuses a target that is the talk or one of its parents, and a non-empty directory that is not a previous export (no `index.html`).
- `deploy` keeps an existing `.github/workflows/slidesk.yml`, `.gitlab-ci.yml` or `link.yml`; pass `--force` to replace it.
- `slidesk skills` installs `.claude/skills/slidesk/SKILL.md` and `.claude/skills/slidesk-addons/SKILL.md`, where Claude Code loads them. The `.claude/skills/slidesk.md` and `slidesk.link.md` files of older versions can be deleted.
- Addon messages are lowercase (`plugin @gouz/steps installed`) and `push` takes a `name` argument for every kind.

### 🔒 Security and data safety

- `save -t ..` (or any parent of the talk) deleted that whole directory, the talk included. Fixed.
- The slidesk.link token (`~/.slidesk`) is stored readable by its owner only; tokens stored by older versions are tightened on their next use.
- Only the speaker (same machine, or the speaker token) can drive a talk over the websocket; `link host` prints separate audience and speaker urls.
- Addon names are validated, so an install or a removal cannot escape its directory.
- `push` and `link host` pack into a temporary directory: a `link.tgz` of yours is no longer overwritten, and nothing is left behind on failure.
- The served files are resolved from the url path, and websocket messages that are not json are ignored.

### ✨ Features

- **Windows**: a `slidesk_windows.zip` binary is published with each release.
- `addRoutes` and `addWS` plugin hooks are reloaded while presenting, like the slides and components.
- `deploy --force`.
- `link login` works even when port 1337 is taken (by a running presentation, for instance).

### 🐛 Fixes

- On Windows, `!include` read no file and every talk came out empty.
- `present` quits on `q`, Ctrl-C and Ctrl-D, and frees its port; Ctrl-C used to leave the server running.
- `present` no longer crashes on a `plugin.json` being written (empty, half-typed, or naming a file that does not exist yet): the plugin is skipped with a warning until it is valid.
- An `!include` loop (e.g. `!include(.)` in `main.md`) is reported instead of hanging, and a missing include is named.
- One save triggers one rebuild, a slow build no longer replaces a newer one, and edited components are reloaded.
- `update` keeps the installed addon when the new version cannot be downloaded, and `install` reports hub errors instead of extracting an error page.
- `component remove @author/name` finds the component.
- `link host` reports a failing hub instead of printing its error page as an url.
- An unreachable hub is reported in one line instead of a stack trace.
- `save` no longer copies `components/` into the export, and its source filters no longer drop files such as `digit`.
- `slidesk create` aborts cleanly when its prompt is interrupted.
- The out-of-date notice is a sentence, and the check for it no longer delays the command.

### 🧰 Internals

- Plugins, themes, templates and components share one implementation of install, remove, update, search and push.
- Type-checking, then smoke tests of the compiled binary on Linux, macOS and Windows, run in CI.

## Earlier versions

See the [GitHub releases](https://github.com/slidesk/slidesk/releases).
