# Manage components

> since **2.14.0**

Components are reusable `.mjs` modules that transform slide HTML during the build. They can be shared via the hub at https://slidesk.link.

## Search

Search for available components on the hub:

```sh
slidesk component search qrcode
```

## Install

Install a component from the hub into your talk's `components/` directory:

```sh
slidesk component install @gouz/qrcode
```

## Update

Update an installed component to the latest version:

```sh
slidesk component update @gouz/qrcode
```

## Remove

Remove a component from your talk:

```sh
slidesk component remove @gouz/qrcode
```

## Push

Share your own component with the community (requires `slidesk link login`):

```sh
slidesk component push my-component
```

The component must be a single `.mjs` file in the `components/` directory following the [component convention](/addons/components).
