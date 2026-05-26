# Manage templates

> since **2.14.0**

Templates are `.sdt` files that define reusable slide layouts. Manage them via the hub at https://slidesk.link.

## Search

Search for templates on the hub:

```sh
slidesk template search split
```

## Install

Install a template into your talk's `templates/` directory:

```sh
slidesk template install @gouz/split
```

## Update

Update an installed template:

```sh
slidesk template update @gouz/split
```

## Remove

Remove a template:

```sh
slidesk template remove @gouz/split
```

## Push

Share your own template (requires `slidesk link login`):

```sh
slidesk template push my-template
```

Templates are `.sdt` files in the `templates/` directory. See the [template documentation](/addons/templates) for the `.sdt` format reference.
