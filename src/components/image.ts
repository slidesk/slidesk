export default function image(data: string) {
  let newData = data;
  [...newData.matchAll(/!image\((.*)\)/g)].forEach((match, _) => {
    const [src, alt, width, height, optionals, caption] = [
      ...match[1].split(","),
    ];
    let classc = "";
    if (
      optionals?.trim().indexOf("[") !== -1 ||
      optionals?.trim().indexOf(" ") === -1
    )
      classc = optionals?.trim().replace("[", "").replace("]", "") || "";
    newData = newData.replace(
      match[0],
      `<figure class="sd-img ${classc}"${
        optionals && classc === "" && optionals.trim() !== ""
          ? ` style="${optionals}"`
          : ""
      } >
        <img src="${src.trim()}" loading="lazy" alt="${alt?.trim()}"${
          width && width.trim() !== "" ? ` data-width="${width.trim()}"` : ""
        }${height && height.trim() !== "" ? ` data-height="${height.trim()}"` : ""} />
        <figcaption ${caption?.trim() === "true" ? "" : "style='display: none;'"}>${alt?.trim()}</figcaption>
      </figure>`,
    );
  });
  return newData;
}
