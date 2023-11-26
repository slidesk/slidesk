# SliDesk: Plugins

To add plugins on your presentation, you have to create a `plugins` directory in the root.

Then, copy a directory of a plugin, which contains a `plugin.json` file.

This json file describes the comportement of the plugin. Each keys of the json correspond to a "hook":

- `addHTML`: add some html at the end of the presentation
- `addHTMLFromFiles`: an array of html files to append in the <body>
- `addScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry)
- `addSpeakerScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry) but on speaker view
- `addStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry)
- `addSpeakerStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry) but on speaker view
- `onSlideChange`: javascript code which will be executed after a slide is changed
- `onSpeakerViewSlideChange`: javascript code which will be executed after a slide is changed

This `plugin.json` file is a JSON with looks like:

```json
{
  "addHTML": "html added at the end before </body>",
  "addHTMLFromFiles": ["an", "array", "of", "assets"],
  "addScripts": ["an", "array", "of", "assets"],
  "addSpeakerScripts": ["an", "array", "of", "assets"],
  "addStyles": ["an", "array", "of", "assets"],
  "addSpeakerStyles": ["an", "array", "of", "assets"],
  "onSlideChange": "here you have to write the javascript code, which be copied into the <script> in the presentation",
  "onSpeakerViewSlideChange": "here you have to write the javascript code, which be copied into the <script> in the presentation"
}
```
