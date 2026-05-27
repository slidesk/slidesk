# Create themes

Themes bundle CSS, JS, templates, plugins, and components into a reusable package.

## Structure

Create a directory inside `themes/`:

```
themes/
└── my-theme/
    ├── theme.css
    ├── script.js
    ├── templates/
    └── plugins/
```

A theme can contain templates and plugins — they are loaded automatically when the theme is applied.

## Usage

Place the theme in your talk's `themes/` directory. SliDesk loads it automatically.

## Share a theme

1. Add a `README.md` for a description.
2. Optionally add `preview/` subfolder with `.webp` images at 320px width.
3. Log in and push:

```sh
slidesk link login
slidesk theme push my-theme
```
