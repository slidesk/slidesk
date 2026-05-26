# How to create a slide

Each slide is defined with a `## ` heading. The first slide in your file does not need a `## ` heading (it uses the `# ` title), unless you want to add a CSS class to it.

## Basic slides

```md
# My Talk Title

## Introduction

This is the first real slide.

## Agenda

1. Part one
2. Part two
3. Part three

## Content with image

!image(diagram.png, Architecture diagram, 800)
```

## Slide with CSS classes

```md
## .[cover dark]

# Welcome to My Talk
```

Classes are applied to the `<section>` element: `<section class="sd-slide cover dark">`.

## Slide with a template

```md
## My Slide .[#split]
```

The `#split` references a template named `split.sdt` in the `templates/` directory.

## Slide with template and classes

```md
## My Slide .[#split left right]
```

## Content with raw HTML

You can embed any HTML, including frameworks like Vue, React, or Svelte:

```html
<div id="app"></div>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

## Using components

```md
!test(hello world)
```

Custom components are defined as `.mjs` files in the `components/` directory (see [Components](/addons/components)).

## Multi-part slides with named blocks (templates)

```md
## Title .[#split]

[[left]]

Content for the left block

[[/left]]

[[right]]

Content for the right block

[[/right]]
```

Named blocks are defined in `.sdt` templates (see [Templates](/addons/templates)).

## Next steps

See the [syntax section](/syntax) for:
- [Images](/syntax/image)
- [Speaker notes](/syntax/speaker-notes)
- [Includes](/syntax/include)
- [Internationalisation](/syntax/internationalisation)
- [Comments](/syntax/comment)
