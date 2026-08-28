export default async (req) =>
  new URL(req.url).pathname === "/from-common"
    ? new Response("common route")
    : null;
