# conf

```
  -c, --conf <name>        use a specific slidesk.toml file
```

Specify a custom config file path:

```sh
slidesk -c tnt.slidesk.toml my-talk
```

## Config values in slides

Use `++KEY++` syntax in slide content to reference config values:

```toml
MYVAR="test"
```

```
++MYVAR++
```

Renders as `test`.

## Config values in plugins

Access config values via `window.slidesk.env.KEY`:

```js
console.log(window.slidesk.env.MYVAR); // "test"
```
