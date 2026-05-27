# Syntax

SliDesk uses Markdown to define slides.

## Headings and slide breaks

`#` defines a level-1 title. `##` defines a level-2 title **and starts a new slide**.

```markdown
## First Slide

# My Talk Title

Content of the first slide.

## Second Slide

Content of the second slide.
```

The first `#` heading does **not** start a new slide — it is the global talk title.

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

Raw URLs are automatically converted to clickable links.

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

Raw HTML is fully supported:

```html
<video autoplay loop src="demo.mp4"></video>
<canvas id="chart"></canvas>
```

## Slide classes

Add classes with `.[classname]` after the heading:

```markdown
## My Slide .[cover dark]
```

Renders as `<section class="sd-slide cover dark">`.

## Templates

Apply a template with `.[#template-name]`:

```markdown
## My Slide .[#split left right]
```
