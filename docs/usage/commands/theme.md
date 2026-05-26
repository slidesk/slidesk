# Manage themes

> since **2.14.0**

Themes bundle CSS, JS, templates, plugins, and components into a reusable package. Manage them via the hub at https://slidesk.link.

## Search

Search for themes:

```sh
slidesk theme search dark
```

## Install

Install a theme into your talk's `themes/` directory:

```sh
slidesk theme install @gouz/night
```

## Update

Update an installed theme:

```sh
slidesk theme update @gouz/night
```

## Remove

Remove a theme:

```sh
slidesk theme remove @gouz/night
```

## Push

Share your own theme (requires `slidesk link login`):

```sh
slidesk theme push my-theme
```

A theme is a directory inside `themes/`. It can contain CSS, JS, and subdirectories for `templates/` and `plugins/`. See the [theme documentation](/addons/themes) for details.
