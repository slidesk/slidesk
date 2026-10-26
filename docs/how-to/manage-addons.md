# Manage addons

Search, install, update, remove, and push addons (plugins, components, templates, themes) from the hub.

All addon commands accept `--slidesk-link-url <url>` to point to a custom hub instance (default: `https://slidesk.link`).

Addons are named `@author/name`. `@author__name` is accepted too: it is the name of the installed directory.

## Search

```sh
slidesk plugin search steps
slidesk component search qrcode
slidesk template search split
slidesk theme search dark
```

## Install

```sh
slidesk plugin install @gouz/steps
slidesk component install @gouz/qrcode
slidesk template install @gouz/split
slidesk theme install @gouz/night
```

Plugins, templates and themes land in their own directory, for instance `plugins/@gouz__steps/`. Components are dropped into `components/` as `<name>.mjs`.

Installing an addon that is already there replaces it, files of the previous version included.

## Update

```sh
slidesk plugin update @gouz/steps
slidesk component update @gouz/qrcode
slidesk template update @gouz/split
slidesk theme update @gouz/night
```

The installed version is only replaced once the new one is downloaded: when the hub cannot be reached, you keep the version you had.

## Remove

```sh
slidesk plugin remove @gouz/steps
slidesk component remove @gouz/qrcode
slidesk template remove @gouz/split
slidesk theme remove @gouz/night
```

When a command fails (addon not found on the hub, hub unreachable, nothing installed under that name), it prints why and exits with code `1`.

## Push (share your own)

Requires `slidesk link login` first.

```sh
slidesk plugin push my-plugin
slidesk component push my-component
slidesk template push my-template
slidesk theme push my-theme
```
