# Internationalisation

Create `XX.lang.json` files for multi-language support:

```json
{
  "default": true,
  "translations": {
    "myVar": "My variable"
  }
}
```

In your slides, use `$$myVar$$` to reference a translation. Switch language with the `--lang` option:

```sh
slidesk -l fr my-talk
```
