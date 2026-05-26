import { mkdir } from "node:fs/promises";

export const uploadImage = async (
  talkdir: string,
  req: Request,
): Promise<Response> => {
  const form = await req.formData();
  const file = form.get("file") as File;
  if (!file || !file.type.startsWith("image/"))
    return new Response("Invalid file", { status: 400 });
  await mkdir(`${talkdir}/assets`, { recursive: true });
  const ext = file.name.split(".").pop();
  const name = `${Date.now()}.${ext}`;
  await Bun.write(`${talkdir}/assets/${name}`, file);
  return new Response(`/assets/${name}`, { status: 200 });
};
