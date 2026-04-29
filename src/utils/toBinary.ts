const toBinary = (string: string): string => {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i += 1) {
    codeUnits[i] = string.codePointAt(i) ?? 0;
  }
  return btoa(String.fromCodePoint(...new Uint8Array(codeUnits.buffer)));
};

export default toBinary;
