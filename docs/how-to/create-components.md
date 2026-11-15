# Create components

Components are `.mjs` modules that transform the source of the talk during the build, before it is rendered from Markdown to HTML.

## Structure

Place your component in `components/` at the root of your talk. The file exports a function that receives the Markdown source of the whole talk and returns it modified, see the [component API](../reference/component-api.md).

```js
export default (data) => {
  let newData = data;
  [...newData.matchAll(/!test\(([^)]*)\)/g)].forEach((match) => {
    newData = newData.replace(match[0], `Test: ${match[1]}`);
  });
  return newData;
};
```

## Usage in slides

```markdown
!test(hello world)
```

The component replaces `!test(hello world)` with `Test: hello world`.

## Manage components via CLI

```sh
slidesk component search qrcode
slidesk component install @gouz/qrcode
slidesk component push my-component
```

See [manage addons](manage-addons).
