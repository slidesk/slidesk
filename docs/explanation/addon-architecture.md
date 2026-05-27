# Addon architecture

SliDesk has four addon systems that let you extend presentations without modifying the core.

## Layers

```
Presentation (main.md)
  │
  ├── Themes      │  CSS + JS (visual layer)
  ├── Templates   │  HTML layout (structure layer)
  ├── Components  │  .mjs transforms (build-time layer)
  └── Plugins     │  Front & back-end hooks (runtime layer)
```

## Themes

Themes bundle CSS, JS, templates, and plugins. They are the highest-level addon and can include any of the other types. Themes are placed in `themes/` and auto-load.

## Templates

Templates are `.sdt` files that define the HTML structure of a slide. They use `<sd-title />`, `<sd-content />`, and `<sd-block />` placeholders. Slide content is injected into these placeholders at build time.

## Components

Components are `.mjs` files that transform the full slide HTML at build time. They receive the generated HTML and return modified HTML. This is useful for custom syntax like `!component()`.

## Plugins

Plugins hook into the presentation at runtime. Front-end plugins inject scripts, styles, and HTML. Back-end plugins add HTTP routes and WebSocket handlers to the server.

## Hub (slidesk.link)

All four addon types can be shared via the hub at https://slidesk.link. The CLI commands (`slidesk plugin push`, `slidesk theme push`, etc.) handle publishing and discovery.
