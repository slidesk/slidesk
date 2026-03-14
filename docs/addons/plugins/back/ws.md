# WebSocket Plugin

You need the hook:

> `addWS`: a `.mjs` file will be imported on Server launch

Example:

```js
export default async (message) => {
  const { cwd, command, key } = JSON.parse(message);
  const proc = Bun.spawn(command.split(" "), {
    cwd: cwd ?? process.env.HOME,
  });
  return {
    key,
    result: await new Response(proc.stdout).text(),
  };
};
```
