# lang

```
  -l, --lang <param>       specify the language version
```

View the presentation in a specific language (requires `.lang.json` files):

```sh
slidesk -l fr my-talk
```

`-l fr` reads `fr.lang.json` next to `main.sdf` / `main.md`, and in each theme (`themes/<theme>/fr.lang.json`, see [translations of a theme](../syntax/internationalisation.md#translations-of-a-theme)). When neither the talk nor a theme has that file, the command stops and lists the languages it found, instead of silently showing the default one.
