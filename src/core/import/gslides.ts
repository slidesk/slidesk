const ID = /\/presentation\/d\/(?:e\/)?([\w-]+)/;

export const presentationId = (source: string) => source.match(ID)?.[1] ?? null;

const gslides = async (source: string) => {
  const id = presentationId(source);
  if (id === null)
    throw new Error(`no Google Slides presentation id found in ${source}`);

  const url = `https://docs.google.com/presentation/d/${id}/export/pptx`;
  const response = await fetch(url, { redirect: "follow" });
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || type.includes("text/html"))
    throw new Error(
      `unable to download this Google Slides presentation.
   Make sure it is shared with "anyone with the link", or download it
   yourself (File > Download > Microsoft PowerPoint) and import the .pptx.`,
    );

  return new Uint8Array(await response.arrayBuffer());
};

export default gslides;
