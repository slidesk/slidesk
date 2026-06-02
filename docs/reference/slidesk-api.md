# SliDesk API (`window.slidesk`)

Plugins and scripts interact with the presentation at runtime through the global `window.slidesk` object. The available properties differ between the **presentation view** (`index.html`) and the **speaker/notes view** (`notes.html`).

## Presentation view (`index.html`)

| Property / Method | Type | Description |
|---|---|---|
| `slides` | NodeList | All `.sd-slide` elements |
| `currentSlide` | number | Index of the current slide |
| `env` | object | Full configuration from `slidesk.toml` |
| `domain` | string | Current domain (from `slidesk.DOMAIN` or `"localhost"`) |
| `deployed` | boolean | `true` when exported via `slidesk save` |
| `lastAction` | string | Last navigation action (`"next"` / `"previous"`) |
| `animationTimer` | number | Transition duration in ms (from `slidesk.TRANSITION`, default `300`) |
| `io` | WebSocket | WebSocket connection to the server (`/ws`), `undefined` on `file://` |
| `channel` | BroadcastChannel | BroadcastChannel fallback (`"slidesk_sync"`), set by `setupChannel()` |
| `next()` | function | Go to next slide |
| `previous()` | function | Go to previous slide |
| `goto(num)` | function | Jump to a specific slide (number or `{data: number}`) |
| `fullscreen()` | function | Toggle fullscreen mode |
| `changeSlide()` | function | Apply current slide CSS, send sync data, call `onSlideChange()` |
| `cleanOldSlide(id)` | function | Remove `sd-current` and `no-sd-animation` classes from a slide |
| `saveCheckpoints()` | function | Save timer checkpoints to `localStorage` |
| `sendMessage(payload)` | function | Send `{action, payload}` via channel or WebSocket |
| `waitForSocketConnection(payload)` | function | Retry sending until WebSocket is open |
| `setupChannel()` | function | Create fallback `BroadcastChannel` for sync without a server |
| `onSlideChange()` | function | Called after each slide change (plugins can override via `onSlideChange` hook) |
| `timeoutResize` | number | Resize debounce timer reference |
| `touchStart` | number | Touch start X position (swipe gesture) |
| `touchMove` | number | Touch move X position (swipe gesture) |

## Speaker / Notes view (`notes.html`)

| Property / Method | Type | Description |
|---|---|---|
| `io` | WebSocket | WebSocket connection to the server (`/ws`) |
| `channel` | BroadcastChannel | BroadcastChannel fallback (`"slidesk_sync"`), set by `setupChannel()` |
| `timer` | Element | `#sd-sv-timer` DOM element |
| `subtimer` | Element | `#sd-sv-subtimer` DOM element |
| `scrollPosition` | number | Current notes scroll position (px) |
| `checkpoints` | array | Timer checkpoints loaded from `localStorage` |
| `presentationPath` | string | Path to `index.html` derived from the notes URL |
| `getPresentationPath()` | function | Derive the presentation path from the current URL |
| `setupChannel()` | function | Create `BroadcastChannel` for fallback sync |
| `loadInitialState()` | function | Restore last slide and checkpoints from `localStorage` |
| `createButtons()` | async function | Create "Open presentation" buttons for each screen |
| `notes_up()` | function | Scroll notes up by 100px |
| `notes_down()` | function | Scroll notes down by 100px |
| `start_timer()` | function | Start the presentation timer |
| `onSpeakerViewSlideChange()` | function | Called after slide change in speaker view (resets scroll, runs plugin hooks) |

## Slide change lifecycle

When a slide change occurs (via `next()`, `previous()`, or `goto()`):

1. `cleanOldSlide(currentSlide)` — removes `sd-current` from the departing slide
2. The departing slide gets `sd-previous`
3. `currentSlide` is incremented/decremented
4. `changeSlide()` is called:
   - `saveCheckpoints()` persists timer data
   - New slide gets `sd-current`
   - `location.hash` is updated
   - Sync data (`current`, `future`, `goto`) is sent via WebSocket or BroadcastChannel
   - Images with `data-src` are loaded
   - `onSlideChange()` executes (fires any plugin hooks)
