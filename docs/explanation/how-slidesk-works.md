# How SliDesk works

SliDesk is a talk engine built on [Bun](https://bun.sh). It converts Markdown into a web-based presentation served over HTTP.

## Architecture

```
main.sdf / main.md
       │
       ▼
  ┌─────────────┐
  │   Builder   │  Parses Markdown → HTML slides
  └──────┬──────┘
         │ slides HTML
         ▼
  ┌─────────────┐
  │   Server    │  HTTP + WebSocket server
  └──────┬──────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Browser   Terminal
 (slides)  (telnet)
```

## Builder

The builder reads `main.sdf` or `main.md`, parses it with markdown-it, processes components, applies templates, resolves `!include()` directives, and generates the final HTML for each slide.

## Server

The HTTP server serves the presentation and speaker view. A WebSocket connection provides live reload when files change and communication between the presentation and speaker view.

## File watcher

SliDesk watches the talk directory for changes. When a file is modified, the browser refreshes automatically via WebSocket.

## Speaker view

The speaker view runs on a separate page (`/notes.html`) and communicates with the presentation view via WebSocket. It shows the current slide, next slide, timer, and speaker notes.

## Telnet server

An optional telnet server lets you control the presentation from any terminal, useful when presenting remotely or on minimal setups.
