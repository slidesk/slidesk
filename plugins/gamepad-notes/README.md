# SliDesk Plugin: gamepad-notes

This plugin allows you to control the navigation with a gamepad from the speaker view.

Per default, arrows left and right and buttons A and B control next() and previous().

You can override it with a `mapping.json` file in the root directory of the presentation.

Example:

```json
{
  "1": "next",
  "3": "previous",
  "4": "previous"
}
```

Keys correspond to the button's key and values correspond to action ("next", "previous", "notes_up", "notes_down", "start_timer").

WARNING: `gamepad-notes` does not be loaded with `gamepad`
