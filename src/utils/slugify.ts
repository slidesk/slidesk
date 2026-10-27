const slugify = (data: string): string =>
  data
    // é → e rather than dropped with the other symbols
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/[\s_-]+/g, "-");

export default slugify;
