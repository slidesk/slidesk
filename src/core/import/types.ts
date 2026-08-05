export type ImportedSlide = {
  title: string;
  content: string;
  notes: string;
  classes: string[];
};

export type ImportedDeck = {
  title: string;
  slides: ImportedSlide[];
  assets: Record<string, Uint8Array>;
};

export type ImportKind = "pptx" | "gslides" | "slidev" | "revealjs";
