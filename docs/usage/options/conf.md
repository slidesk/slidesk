# conf

```
  -c, --conf <name>        use a specific slidesk.toml file (default: "")
```

SliDesk can read a `slidesk.toml` file.

If your talk's directory have a `slidesk.toml`, then you can use it for many purpose.

With this option, you can specify the path of your `slidesk.toml` file to load.

```
slidesk -c tnt.slidesk.toml my-talk
```

## SliDesk configuration

See the proper chapter: [Configuration of SliDesk](/configuration)

## Plugin usage

SliDesk will create an object property in `window.slidesk.env` to give you an access of key-value.

Example:

```toml
MYVAR="test"
```

If your plugin execute this following script, it will display in console "test".

```js
console.log(window.slidesk.env.MYVAR);
```

## Syntax usage

SliDesk allows you to fetch value from a `slidesk.toml` file. With this following syntax:

```
++MYVAR++
```

This entry will be replaced with its content `test` when it renders the presentation.
