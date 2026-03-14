---
sidebar_position: 1
---

# Themes

## Usage

To use a SliDesk theme, it simply needs to be located in the `themes` directory of your talk.

Example:

```
themes/
|_ tnt2026/
```

A theme can be composed of templates, plugins, and components, which will be automatically loaded.

## Creation

To create a theme, simply create a directory within the `themes` folder located in the root directory of your talk (next to the `main.sdf` file).

In this directory, you can place as many CSS and JS files as you want.

You can also create a `templates` and/or `plugins` directory to place the plugins and/or templates required for the theme.

## Sharing

Once your theme is complete, you can share it with the community.

To do this, create a `README.md` file in the directory to include a description.

If you want to add previews, create a subfolder `preview` with images in `.webp` format with a width of 320px.

Then you can push your theme (once you're logged to https://slidesk.link with `slidesk link login`):

```
slidesk theme push <YOURTHEME>
```

`<YOURTHEME>` is the name of the directory of your theme without spaces, lowercase
