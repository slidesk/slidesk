/* eslint-disable no-undef */

export const webSockets = (req) =>
  globalThis.server.upgrade(req)
    ? undefined
    : new Response("WebSocket upgrade error", { status: 400 });

export const getFile = (req, options, https) => {
  const fileurl = req.url.replace(
    `http${https ? "s" : ""}://${options.domain}:${options.port}`,
    "",
  );
  const file = Bun.file(
    fileurl.match(/https?:\/\/(\S*)/g)
      ? fileurl
      : `${globalThis.path}${fileurl}`,
  );
  if (file.size !== 0)
    return new Response(file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  return new Response(`${req.url} not found`, { status: 404 });
};
