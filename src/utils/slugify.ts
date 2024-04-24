const slugify = (data: string): string =>
  data
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-");

export default slugify;
