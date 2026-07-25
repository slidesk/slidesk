# Why SliDesk?

SliDesk is a contraction of **Slide** and **Desk**. It is an open-source tool for both slide creation and conference presentation: write your talk in Markdown, generate it, and present it in the browser.

## The short version

> You want plain Markdown, native internationalisation, and file includes — without standing up a Vue/Vite project to get them.

That is the gap SliDesk fills. Markdown-first tools stay minimal and leave i18n and includes to plugins or preprocessors. Component-framework tools give you power, but hand you a front-end app to maintain in exchange. SliDesk keeps the single-binary, single-Markdown-file experience *and* ships the two features that matter once a talk grows past a handful of slides.

## Compared to the alternatives

| | Marp | Slidev | Reveal.js | SliDesk |
| --- | --- | --- | --- | --- |
| Authoring format | Markdown | Markdown + Vue | HTML / Markdown | Markdown (`.md` / `.sdf`) |
| Runtime you must learn | — | Vue + Vite | JS API | — |
| Install footprint | Node / CLI | Node project | Node project | single Bun binary |
| Multi-language from one source | ✗ | ✗ | ✗ | ✅ `.lang.json` + `--lang` |
| Slide includes | ✗ (plugin / preprocessor) | per file, via `src:` frontmatter | external Markdown per section | ✅ file **or** directory, one line |
| Speaker view (next slide, timers, notes) | limited | ✅ | ✅ | ✅ |
| Live reload while editing | ✅ | ✅ | via tooling | ✅ |
| Present from a terminal | ✗ | ✗ | ✗ | ✅ telnet |
| Embed raw HTML / Vue / React / Svelte | limited | Vue-centric | ✅ | ✅ unrestricted |

To be precise about where SliDesk actually differs:

- **Multi-language from one source is the outlier.** Marp, Slidev, and Reveal.js have no built-in equivalent — the usual answer is "duplicate the deck" or "write a preprocessor".
- **Includes exist elsewhere, but they cost you the project.** Slidev imports one file per `src:` frontmatter block, and you get that only inside a Vue/Vite app. SliDesk includes a file *or a whole directory* with a single `!include()` line, from a plain Markdown file and a single binary.

So the claim is not "SliDesk does more than everyone". It is that **Markdown-first + native i18n + directory-level includes, with no front-end project to maintain**, is a combination you cannot currently get anywhere else.

## Why native i18n matters

The usual workaround for a bilingual talk is to duplicate the deck: `talk-en/` and `talk-fr/`. Every layout tweak, every corrected typo, every updated screenshot then has to be applied twice, and the two copies drift apart before the second run of the talk.

SliDesk keeps one source of truth. Slides hold `$$variables$$`; the words live in `en.lang.json`, `fr.lang.json`, and so on, next to your main file. One file carries `"default": true` for the fallback, and `--lang fr` picks another at present time.

```sh
slidesk my-talk        # default language
slidesk -l fr my-talk  # same slides, same theme, same speaker notes
```

Translation is applied *after* includes are resolved, so variables work inside every included file. See the [internationalisation reference](../reference/syntax/internationalisation) for the details.

## Why native includes matter

A one-hour talk in a single Markdown file is unpleasant to edit and unpleasant to review. `!include()` splits it by section:

```markdown
# $$title$$

!include(slides/01-intro.md)
!include(slides/02-demo.md)
!include(slides/99-questions.md)
```

You can include a whole directory — files are gathered recursively and sorted alphabetically — which makes reordering a matter of renaming files, and makes a section reusable across talks. Combined with i18n, a language-agnostic `slides/` directory becomes a library you can pull into any deck. See the [includes reference](../reference/syntax/includes).

## Everything else

- **Server** with live reload via WebSocket
- **Presentation view** with keyboard, touch, and swipe navigation
- **Speaker view** showing current and next slide, timer(s), and notes
- **File watcher** — edit files, the browser updates in real time
- **Image management** with responsive sizing and captions
- **Theme system** with CSS custom properties
- **Plugin system** for front-end scripts, back-end routes, and WebSocket handlers
- **Component system** for custom HTML transformations
- **Template system** with named blocks and reusable layouts
- **Presentation generator** (`slidesk create`)
- **Telnet server** to present from any terminal
- **Hub** at [slidesk.link](https://slidesk.link) to share addons

## Philosophy

Modularity is essential. SliDesk must be lightweight but expandable as needed.

Using Bun means we can ship a standalone binary with no external dependencies — nothing to install, nothing to keep up to date in a `package.json` you did not want.

## Why a new tool?

- It is fun to create something
- A tool that does only the minimum
- A very small, lightweight tool
- Permissive — embed raw HTML, Vue, React, Svelte, etc. without restrictions

## Links

- **Source**: https://github.com/slidesk/slidesk
- **Hub**: https://slidesk.link
- **VSCode extension**: https://github.com/slidesk/vscode-sdf-language
