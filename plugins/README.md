# SliDesk: Plugins

To add plugins on your presentation, you have to create a `plugins` directory in the root.

Then, copy a directory of a plugin, which contains a `plugin.json` file.

This `plugin.json` file is a JSON with looks like:

```json
{
  "onSlideChange": "here you have to write the javascript code, which be copied into the <script> in the presentation",
  "addScripts": ["an", "array", "of", "assets"],
  "addSpeakerScripts": ["an", "array", "of", "assets"],
  "addStyles": ["an", "array", "of", "assets"]
}
```
