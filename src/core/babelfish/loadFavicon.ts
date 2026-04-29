import faviconSVG from "../../templates/slidesk.svg" with { type: "text" };

const loadFavicon = async (sdfPath: string) => {
  const ftypes = [
    { name: "favicon.svg", type: "image/svg+xml" },
    { name: "favicon.ico", type: "image/x-icon" },
    { name: "favicon.png", type: "image/png" },
  ];
  for (const f of ftypes) {
    if (await Bun.file(`${sdfPath}/${f.name}`).exists()) {
      return {
        name: f.name,
        content: await Bun.file(`${sdfPath}/${f.name}`).bytes(),
        type: f.type,
      };
    }
  }
  return {
    name: "favicon.svg",
    content: faviconSVG,
    type: "image/svg+xml",
  };
};

export default loadFavicon;
