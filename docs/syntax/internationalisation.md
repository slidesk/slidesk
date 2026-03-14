# Internationalisation

With SliDesk, you can manage multiple languages in your presentation. Then you can choose your presentation language with the `--lang` option.

To do this, you need to create `XX.lang.json` files.

Example:

```json
{
  "default": true,
  "translations": {
    "myVar": "My variable"
  }
}
```

We can see in this JSON that this is the default language.

We also see a "myVar" variable, which will be replaced by "My variable".

To do this, use the following syntax `$$myVar$$` in the presentation text.
