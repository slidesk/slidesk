const translate = (presentation, json) => {
  let pres = presentation;
  [...pres.matchAll(/\${2}(\w+)\${2}/g)].forEach((match) => {
    pres = pres.replace(match[0], json.translations[match[1]] ?? match[0]);
  });
  return pres;
};

export default translate;
