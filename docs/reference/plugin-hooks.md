# Plugin hooks

Plugins are defined by a `plugin.json` file. Each key corresponds to a hook:

| Hook | Type | Description |
|------|------|-------------|
| `addHTML` | string | HTML injected at the end of the presentation body |
| `addHTMLFromFiles` | string[] | Array of HTML file paths to append in the body |
| `addScripts` | string[] | Script URLs loaded as `<script src="...">` |
| `addScriptModules` | string[] | Script URLs loaded as `<script type="module" src="...">` |
| `addSpeakerScripts` | string[] | Script URLs loaded only in the speaker view |
| `addStyles` | string[] | CSS URLs loaded as `<link rel="stylesheet" href="...">` |
| `addSpeakerStyles` | string[] | CSS URLs loaded only in the speaker view |
| `onSlideChange` | string | JavaScript executed after each slide change |
| `onSpeakerViewSlideChange` | string | JavaScript executed after each slide change in speaker view |
| `addWS` | string | Path to a `.mjs` file imported on server launch (WebSocket) |
| `addRoutes` | string | Path to a `.mjs` file imported on server launch (HTTP routes) |
| `tags` | string[] | Keywords for searching the plugin on the hub |

## Plugin structure

```
plugins/
└── my-plugin/
    ├── plugin.json
    ├── front/
    ├── back/
    └── ...
```
