# SliDesk: Plugins

To add plugins on your presentation, you have to create a `plugins` directory in the root.

Then, copy a directory of a plugin, which contains a `plugin.json` file.

This json file describes the comportement of the plugin. Each keys of the json correspond to a "hook":

- addHTML: add some html at the end of the presentation
- addScripts: an array of ressources to load (will be convert to script tag with src value as each entry)
- addSpeakerScripts: an array of ressources to load (will be convert to script tag with src value as each entry) but on speaker view
- addStyles: an array of ressources to load (will be convert to link tag with href value as each entry)
- onSlideChange: javascript will be executed after a slide is changed

This `plugin.json` file is a JSON with looks like:

```json
{
  "onSlideChange": "here you have to write the javascript code, which be copied into the <script> in the presentation",
  "addHTML": "html added at the end before </body>",
  "addScripts": ["an", "array", "of", "assets"],
  "addSpeakerScripts": ["an", "array", "of", "assets"],
  "addStyles": ["an", "array", "of", "assets"]
}
```