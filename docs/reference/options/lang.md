# lang

```
  -l, --lang <param>       specify the language version
```

View the presentation in a specific language (requires `.lang.json` files):

```sh
slidesk -l fr my-talk
```

`-l fr` reads `fr.lang.json` next to `main.sdf` / `main.md`. When that file does not exist, the command stops and lists the languages it found, instead of silently showing the default one.
