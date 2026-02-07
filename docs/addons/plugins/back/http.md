# HTTP Plugin

You need the hook:

> `addRoutes`: a `.mjs` file will be imported on Server launch

//@TODO: explain the tiny sdk

Example:

```js
export default async (req, env) => {
  const url = new URL(req.url);
  if (url.pathname === "/public") {
    const text = await Bun.file(
      `${globalThis.path}/plugins/minitel/back/index.html`
    ).text();
    return new Response(text.replace("__MINITEL__", env.MINITEL_IP), {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
  return null;
};
```
