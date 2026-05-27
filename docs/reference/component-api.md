# Component API

Components are `.mjs` files placed in the `components/` directory of your talk.

## Signature

```js
export default (data) => {
  // data: the full HTML generated so far
  // return: the modified HTML string
  return newData;
};
```

## Conventions

SliDesk uses the `!component-name()` syntax to invoke components in slide content. The component function receives the entire HTML and must return the modified version.

## Runtime API (`window.slidesk`)

Plugins and scripts can interact with the presentation at runtime:

| Property / Method | Description |
|---|---|
| `slides` | All `.sd-slide` elements (NodeList) |
| `currentSlide` | Index of the current slide (number) |
| `env` | Configuration values from `slidesk.toml` |
| `domain` | Current domain (string) |
| `deployed` | `true` when exported via `slidesk save` |
| `lastAction` | Last navigation action (`"next"` / `"previous"`) |
| `io` | WebSocket connection to the server |
| `next()` | Go to next slide |
| `previous()` | Go to previous slide |
| `goto(num)` | Jump to a specific slide |
| `fullscreen()` | Toggle fullscreen |
| `onSlideChange()` | Called after each slide change (override to hook in)
