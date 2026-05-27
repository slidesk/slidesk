# Manage addons

Search, install, update, remove, and push addons (plugins, components, templates, themes) from the hub.

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

## Update

```sh
slidesk plugin update @gouz/steps
slidesk component update @gouz/qrcode
slidesk template update @gouz/split
slidesk theme update @gouz/night
```

## Remove

```sh
slidesk plugin remove @gouz/steps
slidesk component remove @gouz/qrcode
slidesk template remove @gouz/split
slidesk theme remove @gouz/night
```

## Push (share your own)

Requires `slidesk link login` first.

```sh
slidesk plugin push my-plugin
slidesk component push my-component
slidesk template push my-template
slidesk theme push my-theme
```
