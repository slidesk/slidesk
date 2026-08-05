import { describe, expect, it } from "bun:test";
import {
  contentTypes,
  escapeXML,
  notesSlide,
  notesSlideRels,
  presentation,
  presentationRels,
  slide,
  slideRels,
} from "./ooxml";

describe("escapeXML function", () => {
  it("should escape xml entities", () => {
    expect(escapeXML(`<a href="x">a & b'c</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;a &amp; b&apos;c&lt;/a&gt;",
    );
  });

  it("should leave a plain string untouched", () => {
    expect(escapeXML("Démo Export")).toBe("Démo Export");
  });
});

describe("contentTypes function", () => {
  it("should declare an override per slide", () => {
    const xml = contentTypes(3, []);
    expect(xml).toContain("/ppt/slides/slide1.xml");
    expect(xml).toContain("/ppt/slides/slide3.xml");
    expect(xml).not.toContain("/ppt/slides/slide4.xml");
  });

  it("should skip the notes parts when no slide has notes", () => {
    const xml = contentTypes(3, []);
    expect(xml).not.toContain("notesMaster1.xml");
    expect(xml).not.toContain("notesSlide");
    expect(xml).not.toContain("theme2.xml");
  });

  it("should declare an override only for the noted slides", () => {
    const xml = contentTypes(3, [1, 3]);
    expect(xml).toContain("/ppt/notesMasters/notesMaster1.xml");
    expect(xml).toContain("/ppt/theme/theme2.xml");
    expect(xml).toContain("/ppt/notesSlides/notesSlide1.xml");
    expect(xml).toContain("/ppt/notesSlides/notesSlide3.xml");
    expect(xml).not.toContain("/ppt/notesSlides/notesSlide2.xml");
  });
});

describe("presentation function", () => {
  it("should list every slide with its relationship", () => {
    const xml = presentation(2, 12192000, 6858000, false);
    expect(xml).toContain('<p:sldId id="256" r:id="rId2"/>');
    expect(xml).toContain('<p:sldId id="257" r:id="rId3"/>');
    expect(xml).toContain('<p:sldSz cx="12192000" cy="6858000"/>');
    expect(xml).toContain('<p:notesSz cx="6858000" cy="9144000"/>');
    expect(xml).not.toContain("notesMasterIdLst");
  });

  it("should declare the notes master before the slide list", () => {
    const xml = presentation(2, 12192000, 6858000, true);
    expect(xml).toContain('<p:notesMasterId r:id="rId5"/>');
    expect(xml.indexOf("notesMasterIdLst")).toBeLessThan(
      xml.indexOf("sldIdLst"),
    );
  });
});

describe("presentationRels function", () => {
  it("should point rId1 to the master and keep the theme last", () => {
    const xml = presentationRels(2, false);
    expect(xml).toContain(
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
    );
    expect(xml).toContain('Id="rId2"');
    expect(xml).toContain('Id="rId3"');
    expect(xml).toContain('Id="rId4"');
    expect(xml).toContain('Target="theme/theme1.xml"');
    expect(xml).not.toContain("notesMasters");
  });

  it("should add the notes master after the theme", () => {
    const xml = presentationRels(2, true);
    expect(xml).toContain(
      'Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="notesMasters/notesMaster1.xml"',
    );
  });
});

describe("slide function", () => {
  it("should stretch the picture to the slide size", () => {
    const xml = slide(1, 12192000, 6858000);
    expect(xml).toContain('<a:ext cx="12192000" cy="6858000"/>');
    expect(xml).toContain('<a:blip r:embed="rId2"/>');
  });
});

describe("slideRels function", () => {
  it("should bind the layout and the matching image", () => {
    const xml = slideRels(4);
    expect(xml).toContain('Target="../slideLayouts/slideLayout1.xml"');
    expect(xml).toContain('Target="../media/image4.png"');
    expect(xml).not.toContain("notesSlide");
  });

  it("should bind the notes slide when the slide has notes", () => {
    expect(slideRels(4, true)).toContain(
      'Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide4.xml"',
    );
  });
});

describe("notesSlide function", () => {
  it("should turn each line into a paragraph", () => {
    const xml = notesSlide("first line\nsecond line");
    expect(xml).toContain("<a:t>first line</a:t>");
    expect(xml).toContain("<a:t>second line</a:t>");
    expect(xml.match(/<a:p>/g)).toHaveLength(2);
  });

  it("should escape the note content", () => {
    expect(notesSlide("Tom & <Jerry>")).toContain(
      "<a:t>Tom &amp; &lt;Jerry&gt;</a:t>",
    );
  });

  it("should keep the slide image placeholder", () => {
    expect(notesSlide("a note")).toContain('<p:ph type="sldImg"/>');
  });
});

describe("notesSlideRels function", () => {
  it("should bind the notes master and the matching slide", () => {
    const xml = notesSlideRels(2);
    expect(xml).toContain('Target="../notesMasters/notesMaster1.xml"');
    expect(xml).toContain('Target="../slides/slide2.xml"');
  });
});
