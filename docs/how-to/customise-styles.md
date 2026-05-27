# Customise styles

Add custom styles and scripts to your presentation with the `add_styles` and `add_scripts` directives at the top of your `main.sdf` or `main.md`:

```
/::
add_styles: files separated with a comma
add_scripts: files separated with a comma
::/
```

If you add a `favicon.ico`, `.png`, or `.svg` at the root of your project, it replaces the default one.

## Example

```
/::
add_styles: custom.css
::/
```

## CSS custom properties

SliDesk exposes CSS variables for easy theming:

```css
:root {
  --sd-heading1-size: 8.5vw;
  --sd-heading1-line-height: 1;
  --sd-heading2-size: 5vw;
  --sd-heading2-line-height: 1;
  --sd-text-size: 2.2vw;
  --sd-text-line-height: 1.2;

  --sd-background-color: #242424;
  --sd-heading-color: rgba(255, 255, 255, 0.97);
  --sd-text-color: rgba(255, 255, 255, 0.87);
  --sd-primary-color: rgb(37, 186, 146);

  --sd-sv-timer-size: 80px;
  --sd-sv-text-size: 40px;
  --sd-sv-text-line-height: 1.2;
  --sd-sv-background-color: #242424;
  --sd-sv-text-color: rgba(255, 255, 255, 0.87);
}
```

You're free to add your own styles on top.

## Auto-included assets

Any `.css` or `.js` file placed in the `templates/` or `themes/` directory of your talk is automatically loaded by SliDesk -- no need to list them in `add_styles` or `add_scripts`.

## Shared common directory

To share themes, plugins, and assets across multiple presentations, set `COMMON_DIR` in `slidesk.toml`:

```toml
[slidesk]
COMMON_DIR="path/to/common"
```

Then reference files with the `-=[COMMON]=-` prefix:

```
/::
add_styles: -=[COMMON]=-/theme/custom.css
::/

!image(-=[COMMON]=-/assets/logo.png)
```
