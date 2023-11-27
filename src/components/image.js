export default function image(data) {
  let newData = data;
  [...newData.matchAll(/!image\((.*)\)/g)].forEach((match) => {
    const [src, alt, width, height, optionals] = [...match[1].split(",")];
    newData = newData.replace(
      match[0],
      `<img src="${src.trim()}" loading="lazy" alt="${alt?.trim()}"${
        width && width.trim() !== "" ? ` init-width="${width.trim()}"` : ""
      }${
        height && height.trim() !== "" ? ` init-height="${height.trim()}"` : ""
      }${
        optionals && optionals.trim() !== "" ? `style="${optionals}"` : ""
      } />`,
    );
  });
  return newData;
}
