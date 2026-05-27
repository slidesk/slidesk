# Why SliDesk?

SliDesk is a contraction of **Slide** and **Desk**. It is an open-source tool for both slide creation and conference presentation.

Write your talk in Markdown, generate it, and present it in the browser.

## Similar tools

SliDesk is a talk engine similar to RevealJS or SliDev, but built with [Bun](https://bun.sh).

## Features

- **Server** with live reload via WebSocket
- **Presentation view** with keyboard, touch, and swipe navigation
- **Speaker view** showing current and next slide, timer(s), and notes
- **File watcher** — edit files, the browser updates in real time
- **Image management** with responsive sizing and captions
- **Theme system** with CSS custom properties
- **Plugin system** for front-end scripts, back-end routes, and WebSocket handlers
- **Component system** for custom HTML transformations
- **Template system** with named blocks and reusable layouts
- **Internationalisation** with `.lang.json` translation files
- **Presentation generator** (`slidesk create`)
- **Telnet server** to present from any terminal
- **Hub** at [slidesk.link](https://slidesk.link) to share addons

## Philosophy

Modularity is essential. SliDesk must be lightweight but expandable as needed.

The advantage of using Bun is the ability to generate a standalone binary with no external dependencies.

## Why a new tool?

- It is fun to create something
- A tool that does only the minimum
- A very small, lightweight tool
- Permissive — embed raw HTML, Vue, React, Svelte, etc. without restrictions

## Links

- **Source**: https://github.com/slidesk/slidesk
- **Hub**: https://slidesk.link
- **VSCode extension**: https://github.com/slidesk/vscode-sdf-language
