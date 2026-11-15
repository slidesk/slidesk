# Use templates

Templates are `.sdt` files that define reusable slide layouts.

## Apply a template

Reference a template with `.[#template-name]` after the heading:

```markdown
## My Slide .[#split]
```

This applies `templates/split.sdt`, or a `split.sdt` in any subdirectory of `templates/` or of a theme.

## Create a template

Create a `templates/` directory in your talk folder. Add a `.sdt` file:

```html
<!-- templates/split.sdt -->
<div class="split">
  <div class="left">
    <sd-title />
  </div>
  <div class="right">
    <sd-content />
  </div>
</div>
```

- `<sd-title />` — placeholder for the slide title
- `<sd-content />` — placeholder for the slide content

## Named blocks

Define additional placeholders with `[[block]]` / `[[/block]]`:

```html
<div class="split">
  <div class="left">
    <sd-title />
    <sd-block />
  </div>
  <div class="right">
    <sd-content />
    <sd-foo />
  </div>
</div>
```

Then use them in your slides:

```markdown
## Title .[#split]

[[foo]]

Content for the foo block

[[/foo]]

A text

[[block]]

- Item 1
- Item 2

[[/block]]
```

Each named block (`[[block]]`, `[[foo]]`) matches a `<sd-block />`, `<sd-foo />` placeholder in the template. Content outside named blocks goes into `<sd-content />`.

## Share a template

To push it to the hub or install it from git, put the template in its own directory, `templates/my-template/`, with its `.sdt`, its `.css` and `.js` if any, a `README.md` and a `template.json` (`{}` is enough), which `slidesk template remove` and an install from git look for. Every `.css` and `.js` under `templates/` is loaded.

## Manage templates via CLI

Search, install, update, remove, and push templates:

```sh
slidesk template search split
slidesk template install @gouz/split
slidesk template push my-template
```

See [manage addons](manage-addons).
