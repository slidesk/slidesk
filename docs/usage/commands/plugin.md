# Manage plugins

> since **2.14.0**

Plugins extend SliDesk with front-end scripts, styles, server-side routes, and WebSocket handlers. Find them on the hub at https://slidesk.link.

## Search

Search for available plugins:

```sh
slidesk plugin search steps
```

## Install

Install a plugin into your talk's `plugins/` directory:

```sh
slidesk plugin install @gouz/steps
```

## Update

Update an installed plugin:

```sh
slidesk plugin update @gouz/steps
```

## Remove

Remove a plugin:

```sh
slidesk plugin remove @gouz/steps
```

## Push

Share your own plugin (requires `slidesk link login`):

```sh
slidesk plugin push my-plugin
```

Your plugin must have a `plugins/my-plugin/plugin.json` file defining its hooks. See the [plugin documentation](/addons/plugins) for the full reference.
