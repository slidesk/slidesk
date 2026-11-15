# Component API

Components are `.mjs` files placed in the `components/` directory of your talk, or of one of its themes.

## Signature

```js
export default (data, { lang }) => {
  // data: the Markdown source of the whole talk, before it is split into slides
  // lang: the language of the talk (--lang, or else its default XX.lang.json), or undefined
  // return: the modified source
  return newData;
};
```

## When it runs

Components run on the source of the talk once its includes, comments, `!image()` and environment variables are expanded, and before it is split into slides and rendered from Markdown to HTML. They run one after the other, each on the output of the previous one, with the talk directory as the current directory.

The HTML a component returns goes through the Markdown renderer as raw HTML: put a block (`<div>`, `<figure>`…) on its own line, starting at the beginning of the line, or Markdown wraps it in a paragraph or, indented by 4 spaces, turns it into a code block.

## Conventions

SliDesk uses the `!component-name()` syntax to invoke components in slide content. Match the arguments with `\(([^)]*)\)` rather than `\((.*)\)`, which also swallows a later `)` on the same line.

See the [Slidesk API](slidesk-api) reference for the runtime `window.slidesk` object used by plugins and scripts.
