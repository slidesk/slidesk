# Template format

Templates are `.sdt` files placed in the `templates/` directory of your talk.

## Placeholders

| Tag | Description |
|-----|-------------|
| `<sd-title />` | Slide title |
| `<sd-content />` | Slide content |
| `<sd-block />` | Named block (default) |
| `<sd-<name> />` | Named block with custom name |

## Example

```html
<div class="split">
  <div class="left">
    <sd-title />
  </div>
  <div class="right">
    <sd-content />
  </div>
</div>
```

## Named blocks

Define custom blocks in the template:

```html
<sd-title />
<sd-content />
<sd-block />
<sd-foo />
```

Then use `[[block]]` / `[[/block]]` and `[[foo]]` / `[[/foo]]` in your slides.

Each named block must be wrapped between two empty lines.
