---
sidebar_position: 1
---

# SliDesk Syntax

SliDesk uses [Markdown](https://daringfireball.net/projects/markdown/) syntax to define slides.

## Headings and Slide breaks

`# ` defines a level 1 title.  
`## ` defines a level 2 title **and starts a new slide**.

```markdown
## First Slide

# My Talk Title

Content of the first slide.

## Second Slide

Content of the second slide.
```

The very first `#` heading does **not** start a new slide — it's treated as the global talk title.

## Text formatting

```markdown
**bold text**
*italic text*
~~strikethrough~~
`inline code`
```

## Lists

```markdown
- Unordered item
- Another item

1. Ordered item
2. Another ordered item
```

## Links

Raw URLs like `https://example.com` are automatically converted to clickable hyperlinks.

```markdown
[Custom link text](https://example.com)
```

## Code blocks

````markdown
```js
const greeting = "Hello SliDesk!";
console.log(greeting);
```
````

## Blockquotes

```markdown
> This is a quote
> Spanning multiple lines
```

## Horizontal rules

```markdown
---
```

## HTML

Raw HTML is fully supported. You can embed any framework or custom elements:

```html
<video autoplay loop src="demo.mp4"></video>
<canvas id="chart"></canvas>
```

## Slide classes

Add CSS classes to a slide with `.[classname]` after the heading:

```markdown
## My Slide .[cover dark]
```

This renders as `<section class="sd-slide cover dark">`.

## Templates

Apply a template with `.[#template-name]`:

```markdown
## My Slide .[#split left right]
```

See the [Templates](/addons/templates) section for more details.

## Next steps

- [Images](image.md) - `!image()` component
- [Speaker Notes](speaker-notes.md) - `/* */` blocks
- [Includes](include.md) - `!include()` directive
- [Internationalisation](internationalisation.md) - multi-language support
- [Comments](comment.md) - line comments with `////`
