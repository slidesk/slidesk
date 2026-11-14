# Component API

Components are `.mjs` files placed in the `components/` directory of your talk.

## Signature

```js
export default (data, { lang }) => {
  // data: the full HTML generated so far
  // lang: the language of the talk (--lang, or else its default XX.lang.json), or undefined
  // return: the modified HTML string
  return newData;
};
```

## Conventions

SliDesk uses the `!component-name()` syntax to invoke components in slide content. The component function receives the entire HTML and must return the modified version.

See the [Slidesk API](slidesk-api) reference for the runtime `window.slidesk` object used by plugins and scripts.


