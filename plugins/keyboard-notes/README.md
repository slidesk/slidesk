# SliDesk Plugin: keyboard-notes

This plugin allows you to control the navigation with a keyboard from the speaker view.

Per default, arrows left and right control next() and previous(), they can't be override.

You can override it with a `mapping.json` file in the root directory of the presentation.

Example:

```json
{
  "a": "next",
  "b": "previous",
  "c": "previous"
}
```

Keys correspond to the keyboard's key and values correspond to action ("next", "previous", "fullscreen", ...).

WARNING: `keyboard-notes` does not be loaded with `keyboard`
