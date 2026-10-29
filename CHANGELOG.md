# Changelog

All notable changes to SliDesk. Each release on GitHub takes its notes from the matching section below.

## 2.22.2

### 🔒 Security

- **The `PASSPHRASE` of the TLS key no longer reaches the pages**: `slidesk.js` carries the configuration of the talk to every viewer of `present`, and into the site `save` exports, and the passphrase went with it, as did the paths of `KEY` and `CERT`. Only the server reads them now. A talk exported before keeps its passphrase: export it again, and change the passphrase if the site was public.

## 2.22.1

### 🔒 Security

- **A plugin's `addWS` handler can tell the speaker's messages apart**: any viewer can write to the websocket, and a message for a plugin reached its handler whoever sent it. The handler now gets `{ canSend }` as its third argument, `true` only for the speaker ([create plugins](https://slidesk.github.io/slidesk/how-to/create-plugins/)). A handler that acts on the speaker's behalf, such as one running a command, checks it.

## 2.22.0

### ✨ Features

- **[`slidesk design <url>`](https://slidesk.github.io/slidesk/reference/commands/design/)** creates a theme from a website: its background, text and primary colours (headings take the primary one), its fonts and its logo as a watermark at the bottom right of the slides. `--local` downloads the fonts into the theme, so it works offline.

### 📝 Documentation

- [Maths](https://slidesk.github.io/slidesk/reference/syntax/maths/): LaTeX formulas with the new `@gouz/maths` plugin (KaTeX, offline), and the comparison tables say so.

### 🧰 Internals

- The release finds the Homebrew formula pull request right after its creation: it looked it up through GitHub's search, which missed it for 2.20.2 and 2.21.0, and the formula had to be merged by hand.

## 2.21.0

### ✨ Features

- **`slidesk update`** updates every addon of the talk installed from slidesk.link; `slidesk update plugins` (or `components`, `themes`, `templates`) one kind only. An addon that fails is reported and the others are updated anyway.
- **Keyboard**: Space, Page Up / Page Down, Home / End (first / last slide) and `b` or `.` (black screen) join the arrows and `f`. In the speaker view, the same keys drive the talk and ↑ / ↓ scroll the notes. The keyboard plugin can take over any of them with its `keyboard.json`.

### ⚠️ Behaviour changes

- **Components are installed as `components/user__name.mjs`**, so that `slidesk update` knows where they come from. A component installed by an older SliDesk (`components/name.mjs`) is left alone by `update`: install it again once with `slidesk component install user/name`, which also removes the old copy.
- `slidesk create` refuses a directory that is not empty, instead of overwriting its `main.md` and slides.
- In telnet, a slide is reached with its number **then Enter**, as the docs said: a digit used to jump at once, so slides 10 and up could not be reached.
- An image path containing `)` is no longer read whole: `!image(...)` stops at the first `)`, so that two images on one line stay two images.

### 🔒 Security

- **`present` no longer serves private files of the talk** to the network: hidden files and directories (`.git`, `.env`, `.npmrc`…), `.toml` files (with `PASSPHRASE`), `.pem` and `.key` files, and the `KEY` / `CERT` files answer 404.
- **`save` no longer exports them** either, nor `link.yml`: a deploy published `.env.local`, `.npmrc`, TLS keys or `.github/`. If a talk was deployed before, deploy it again, and revoke any secret it held.
- `slidesk link login` only accepts the token of the login it started: a page open at the same time could log the CLI in to another account. This needs slidesk.link to hand back the login state; `--with-token` works in any case.
- The speaker notes are no longer printed on the audience's telnet terminal.

### 🐛 Fixes

- **Fullscreen**: `f` left fullscreen at once, the page reloading on the resize it caused.
- Keys typed in a field, a contenteditable or the xterm plugin, and Cmd / Ctrl / Alt shortcuts (Cmd+F…) are left alone; a held key moves one slide only.
- A link to a slide that no longer exists (one removed while presenting) or an old `#slug` link showed no slide at all: the closest slide is shown.
- Speaker view: ↑ / ↓ scroll the notes from where they are, a new slide shows its notes from the top, and a corrupted `localStorage` no longer stops it.
- **Windows**: `present --open` and `link login` could not open the browser (`start` is not a program); without any browser, the URL is printed instead. `!include` inside an included directory finds its files.
- `link login` says what it does: the URL to open, "already logged in", "logged in".
- Requests to slidesk.link give up after 60 s instead of hanging; an update whose download is broken keeps the installed addon; a search with `#`, `?` or `/` works.
- `save` with a relative path runs the components of the talk; components run from the talk directory.
- `slidesk create "My Talk"` puts the split template into `my-talk/` instead of a stray `My Talk/`, keeps the letters of accented names (`Démo` → `demo`, not `dmo`), and keeps the talk when slidesk.link cannot be reached.
- `!image(...)`: `$$` and `$&` kept as written, two images on one line, quotes in the alt text.
- In telnet, Enter sent as `\r\0` (macOS and BSD telnet) is understood.

### 📝 Documentation

- The keyboard shortcuts, `window.slidesk` (`first()`, `last()`, `black()`, `keys`, `ignoreKey()`), the telnet keys and the websocket actions match the code; a page for `slidesk update`.

### 🧰 Internals

- The tests no longer depend on the order of their files (the console spy is preloaded), and the smoke test waits for the page instead of fixed delays.

## 2.20.3

### 🐛 Fixes

- **A `$$` in a slide is kept as written**: `$$E = mc^2$$` (LaTeX math with a KaTeX or MathJax plugin), `echo $$` or `$&` were turned into `$E = mc^2$`, `$` and `#SECTIONS#`. Titles, template blocks, translations and plugin html had the same problem.
- A `$$key$$` without translation stays visible as written, instead of becoming `$key$`.

### 📝 Documentation

- [An online demo](https://slidesk.github.io/slidesk/demo/), itself a SliDesk talk, in English and [in French](https://slidesk.github.io/slidesk/demo/fr/) from the same source.
- The comparison tables include Typst.

### 🧰 Internals

- The release merges the Homebrew formula pull request with retries: merging it right after its creation failed for 2.20.2.

## 2.20.2

### 🐛 Fixes

- **Code blocks are shown as written**: a `## ` inside a fenced code block no longer starts a new slide, and `!include(...)`, `/* notes */` and `!image(...)` inside it are no longer run. Showing SliDesk syntax on a slide used to split it or break the build.
- A talk given as an absolute path, or outside the working directory (`../talk`), works with every command: `present` and `export` did not find it, and `save` dropped its included slides.
- `slidesk skills` writes nothing unless both skills could be downloaded.
- A `++section++` variable that points to a whole section of `slidesk.toml` is shown as json instead of `[object Object]`.

### 📝 Documentation

- A new README, with a demo GIF, an example, the comparison with Marp, Slidev and reveal.js, and install instructions for every platform.
- The npm package has a description, keywords and a homepage.

### 🧰 Internals

- SliDesk is clean on SonarCloud: every promise is handled, values coming from the network are sanitized before being logged, regexes without risky backtracking, smaller functions in the import scanner, and independent loading (plugins, included files…) runs in parallel.
- `bun run demo:gif` records the README demo.

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
