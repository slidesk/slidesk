export default (req: Request, path: string, env: { [key: string]: string }) => {
  let fileurl = req.url.replace(
    new RegExp(`^https?://${req.headers.get("host")}`, "g"),
    "",
  );
  if (fileurl.startsWith("/-=[COMMON]=-"))
    fileurl = fileurl.replace("-=[COMMON]=-", env.COMMON_DIR);
  let file = Bun.file(
    fileurl.match(/https?:\/\/(\S*)/g) ? fileurl : `${path}${fileurl}`,
  );
  if (fileurl.startsWith("/plugins") && file.size === 0 && env.COMMON_DIR) {
    fileurl = fileurl.replace("/plugins", `/${env.COMMON_DIR}/plugins`);
    file = Bun.file(`${path}${fileurl}`);
  }
  if (file.size !== 0)
    return new Response(file, {
      headers: {
        "Content-Type": file.type,
      },
    });
  return new Response(`${req.url} not found`, { status: 404 });
};
