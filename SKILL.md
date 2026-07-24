---
name: slidesk
description: Author, build, and present SliDesk talks — Markdown/SDF presentations served over HTTP by the Bun-based SliDesk engine. Use when creating or editing a SliDesk talk (main.md / main.sdf), writing slides, configuring slidesk.toml, building themes/templates/components/plugins, adding speaker notes, or running the slidesk CLI (create, present, save, deploy, plugin, theme, template, component, link).
---

# SliDesk

SliDesk turns Markdown into a web-based presentation. It is built with [Bun](https://bun.sh),
serves slides over HTTP with WebSocket live reload, and is extensible via themes, templates,
components, and plugins. Slide files use `.md` or `.sdf` (SliDesk Format) extension.

## Core model

- A talk is a **directory** containing `main.sdf` or `main.md` (plus optional `slidesk.toml`).
- `#` sets the **global talk title** and does *not* start a slide.
- Each `##` heading **starts a new slide** → rendered as `<section class="sd-slide">`.
- The builder parses Markdown (markdown-it) → runs components → applies templates →
  resolves `!include()` → outputs HTML. An HTTP + WebSocket server serves it and live-reloads
  on file changes.

## CLI

```sh
slidesk [options] [talk-dir]     # 'present' is the default subcommand; talk-dir defaults to cwd

slidesk create my-talk           # scaffold a new talk (prompts for title, installs @gouz/split)
slidesk my-talk                  # present → serves on http://localhost:1337 (shows QR code)
slidesk save -t public my-talk   # export standalone static HTML site to ./public
slidesk deploy -t github my-talk # generate CI/CD files: -t github | gitlab | link
```

Subcommands `plugin`, `theme`, `template`, `component` each support `search | install | update | remove | push`.
`link` interacts with the hub: `login`, `host`, `push`.

### present options

| Flag | Meaning |
|------|---------|
| `-n, --notes [slug]` | open speaker view (default `/notes.html`) |
| `-o, --open` | auto-open browser (opens speaker view when combined with `-n`) |
| `-t, --telnet` | also serve over telnet (port `2323`, `telnet localhost 2323`) |
| `-g, --hidden` | hide terminal help, show only the URL |
| `-c, --conf <file>` | use a custom config file (e.g. `-c tnt.slidesk.toml`) |
| `-l, --lang <code>` | present a language version (needs `.lang.json` files) |
| `-h --help`, `-v --version` | help / version |

Flags combine: `slidesk -tn my-talk` = telnet + speaker notes.

Terminal navigation while presenting: **Enter** = next, **P + Enter** = previous, **Q** = quit,
type a **number** = jump. Browser: arrows / swipe, **f** = fullscreen.

## Talk structure

```
my-talk/
├── main.md            # slides (or main.sdf)
├── slidesk.toml       # optional config
├── custom.css         # optional styles
├── slides/            # fragments referenced via !include()
├── themes/<name>/theme.css
├── templates/*.sdt    # reusable layouts
├── components/*.mjs   # HTML transformers
└── plugins/<name>/plugin.json
```

## Slide syntax

Standard Markdown works (bold, italic, `~~strike~~`, `inline code`, lists, links, code fences,
blockquotes, `---` rules, raw HTML). Raw URLs auto-link. Plus SliDesk directives:

| Directive | Purpose |
|-----------|---------|
| `## Title .[cover dark]` | add CSS classes → `<section class="sd-slide cover dark">` |
| `## Title .[#split left right]` | apply template `templates/split.sdt` (extra tokens are args/classes) |
| `!image(path, alt, width, height, styles, addCaption)` | image (only path required; px sizes) |
| `!include(path)` | include a `.sdf`/`.md` file, or a directory (alphabetical order) |
| `!name(args)` | invoke a component |
| `/* ... */` | speaker notes (hidden from audience, shown in speaker view) |
| `//// line` | comment out a line (since 2.15.0) |
| `++KEY++` | inject a `slidesk.toml` value |
| `$$key$$` | inject an i18n translation |

`!image` notes: if the `styles` argument has no spaces it is treated as a **class**; use
`[class1 class2]` bracket syntax for multiple classes. With `WIDTH` set in config, images are responsive.

## Configuration — `slidesk.toml`

Under `[slidesk]`. Any custom key becomes available as `++KEY++` in slides and
`window.slidesk.env.KEY` in plugins.

```toml
[slidesk]
TITLE="My Talk"        # <title> tag
PORT=1337              # HTTP port (default 1337)
DOMAIN="localhost"     # domain in URLs
WIDTH=1920             # reference width for responsive images
TRANSITION=300         # slide transition ms (0 = off)
WATCH=true             # file watcher / live reload (default on)
TELNET_PORT=2323
COMMON_DIR="/path"     # shared themes/plugins/templates/components/assets
# HTTPS: HTTPS=true + KEY, CERT, optional PASSPHRASE
```

`COMMON_DIR` files are referenced with the `-=[COMMON]=-` prefix, e.g.
`!image(-=[COMMON]=-/assets/logo.png)`. Plugins in `COMMON_DIR/plugins/` load automatically.

## Templates (`.sdt`)

Placeholders: `<sd-title />`, `<sd-content />`, `<sd-block />` (default named block),
`<sd-NAME />` (custom named block). In slides, fill named blocks with `[[NAME]] ... [[/NAME]]`;
content outside any named block goes to `<sd-content />`. Each named block must be wrapped in
blank lines. Apply with `## Title .[#template-name]`.

## Themes

A theme is `themes/<name>/` with `theme.css` (plus optional `script.js`, `templates/`, `plugins/`).
Theme CSS loads after `slidesk.css`, so it overrides defaults. Customize via CSS variables such as
`--sd-background-color`, `--sd-heading-color`, `--sd-text-color`, `--sd-primary-color`,
`--sd-heading1-size`, `--sd-heading2-size`, `--sd-text-size`, and speaker-view variables
`--sd-sv-timer-size`, `--sd-sv-background-color`, `--sd-sv-background-color-emergency`, etc.

Key classes: `.sd-app` (root), `.sd-slide` (each slide, off-screen right by default),
`.sd-slide.sd-current` (visible), `.sd-slide.sd-previous` (passed), `.no-sd-animation`
(disables transition), `.sd-img` (figure wrapper), `.sd-notes` (hidden on slides).

## Components (`.mjs`)

A component transforms the full generated HTML string. Place in `components/`:

```js
export default (data) => {
  let out = data;
  [...out.matchAll(/!test\((.*)\)/g)].forEach((m) => {
    out = out.replace(m[0], `Test: ${m[1]}`);
  });
  return out;
};
```

Invoke in slides with `!test(hello world)`.

## Plugins

A plugin is `plugins/<name>/plugin.json` mapping **hooks** to resources:

| Hook | Type | Effect |
|------|------|--------|
| `addHTML` / `addHTMLFromFiles` | string / string[] | HTML appended to body |
| `addScripts` / `addScriptModules` | string[] | `<script>` / `<script type="module">` |
| `addSpeakerScripts` | string[] | scripts in speaker view only |
| `addStyles` / `addSpeakerStyles` | string[] | stylesheets (all / speaker view) |
| `onSlideChange` / `onSpeakerViewSlideChange` | string | JS run after each slide change |
| `addRoutes` | string | `.mjs` adding HTTP routes: `export default async (req, env) => Response|null` |
| `addWS` | string | `.mjs` WebSocket handler: `export default async (message) => ({...})` |
| `tags` | string[] | hub search keywords |

## Runtime API — `window.slidesk`

Presentation view (`index.html`) exposes: `slides`, `currentSlide`, `env`, `domain`, `deployed`,
`animationTimer`, `io` (WebSocket `/ws`), `channel` (BroadcastChannel fallback), and methods
`next()`, `previous()`, `goto(num)`, `fullscreen()`, `changeSlide()`, `sendMessage(payload)`,
`onSlideChange()`. Speaker view (`notes.html`) exposes timer elements, `checkpoints`,
`start_timer()`, `notes_up()/notes_down()`, and syncs via the same WebSocket/BroadcastChannel.

Send commands across views: `window.slidesk.io.send(JSON.stringify({ action: "next" }))`.

## Speaker notes & timing

- Notes: `/* ... */`. Open speaker view with `-n`. It shows current + next slide, timer, notes.
- Checkpoint (clock turns red after a wall-clock time): `//@ < 35:00`
- Per-slide countdown (turns red when elapsed): `//@ [] 02:00`

## Internationalisation

Create `XX.lang.json` files; reference values with `$$key$$`; switch with `-l <code>`.

```json
{ "default": true, "translations": { "greeting": "Hello" } }
```

## Extras & hub

Install ready-made addons from the hub (https://slidesk.link):
`slidesk plugin install @gouz/mermaid`, `slidesk theme install @gouz/night`, etc.
Publish your own with `slidesk <plugin|theme|template|component> push <name>` after `slidesk link login`.

## Full documentation

Complete docs (Diátaxis layout — tutorials, how-to, reference, explanation) are online at
https://slidesk.github.io/slidesk. Example talk: https://github.com/slidesk/talk-slidesk.
VSCode extension: https://github.com/slidesk/vscode-sdf-language. Consult them for edge cases
not covered above.
