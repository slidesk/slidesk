# design

Create a theme from the look of a website.

```sh
slidesk design https://example.com
slidesk design https://example.com --name brand
slidesk design https://example.com --name brand --force
slidesk design https://example.com --local
```

SliDesk reads the page and its stylesheets and writes `themes/<name>/theme.css` in the current directory, with:

- the background and text colours of the page,
- its primary colour: a CSS variable named like `--primary`, `--brand` or `--accent`, else the `theme-color` meta, else the most used saturated colour; the headings take it too,
- the fonts of the body and of the headings, with their Google Fonts and `@font-face` declarations.
- its logo, saved as `themes/<name>/logo.*` and shown as a watermark at the bottom right of every slide: an image mentioning "logo", else the SVG icon of the site, else its `apple-touch-icon`. Change its `opacity` or size in the `.sd-slide::after` rule, or delete the rule to remove it.

A text colour that would not read on the background is replaced by black or white.

| Option | Description |
|---|---|
| `-n`, `--name` | theme name (default: the host name of the website) |
| `-f`, `--force` | overwrite an existing theme |
| `-l`, `--local` | download the fonts into `themes/<name>/fonts` rather than load them from the web: the theme works offline |

The result is a starting point: edit `theme.css` to adjust it, see [Create themes](../../how-to/create-themes.md).
