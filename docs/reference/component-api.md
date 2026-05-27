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
