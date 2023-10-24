export default function image(data) {
  let newData = data;
  [...newData.matchAll(/!image\((.*)\)/g)].forEach((match) => {
    const opts = [...match[1].split("|")];
    newData = newData.replace(
      match[0],
      `<img src="${opts[0].trim()}" ${
        opts.length > 1 ? opts[1].trim() : ""
      } loading="lazy" />`,
    );
  });
  return newData;
}
