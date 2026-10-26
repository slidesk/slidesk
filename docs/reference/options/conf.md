# conf

```
  -c, --conf <name>        use a specific slidesk.toml file
```

Specify a custom config file path:

```sh
slidesk -c tnt.slidesk.toml my-talk
```

The path is relative to the talk directory. A `--conf` file that does not exist is an error, and so is an invalid file: the command names the file and the problem (`slidesk.toml: Cannot redefine table 'slidesk'`).

While presenting, the configuration is read again on every change: editing it updates the slides without a restart. `PORT` and `TELNET_PORT` only change on the next start.

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
