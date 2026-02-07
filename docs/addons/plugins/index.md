# Plugins

SliDesk has a plugin system, so that a minimum number of functions can be included in the kernel to cover the majority of needs, with the possibility of extending it with new functions specific to a presentation.

To achieve this, an architecture must be defined, something simple that a novice or experienced developer can quickly understand.

For a plugin to be taken into account by SliDesk, a "plugins" directory must be created at the root of the presentation. In this folder, create a directory for the plugin, and add a "plugin.json" file.

This JSON file defines the anchor points to which the plugin is attached.

These points are separated into two parts: files to be loaded (in the form of arrays) and code to be inserted (in the form of character strings).

Plugins can be front or back plugins

This `json` file describes the comportement of the plugin. Each keys of the json correspond to a "hook":

- `addHTML`: add some html at the end of the presentation
- `addHTMLFromFiles`: an array of html files to append in the `body`
- `addScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry)
- `addSpeakerScripts`: an array of ressources to load (will be convert to `script` tag with `src` value as each entry) but on speaker view
- `addStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry)
- `addSpeakerStyles`: an array of ressources to load (will be convert to `link` tag with `href` value as each entry) but on speaker view
- `onSlideChange`: javascript code which will be executed after a slide is changed
- `onSpeakerViewSlideChange`: javascript code which will be executed after a slide is changed
- `addWS`: a `.mjs` file will be imported on Server launch
- `addRoutes`: a `.mjs` file will be imported on Server launch
- `tags`: an array of string which contains keywords to find your plugin in the search engine
