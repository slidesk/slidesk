import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import getPresentation from "./getPresentation";

const fixture = join(import.meta.dir, "../../__fixtures__/talk");

describe("getPresentation", () => {
  it("wraps each slide in its own section", async () => {
    const html = await getPresentation(
      "## First\n\ncontent\n\n## Second\n\nmore\n",
      {},
      [],
      {},
    );
    expect(html.match(/<section/g)).toHaveLength(2);
    expect(html).toContain("First");
    expect(html).toContain("Second");
  });

  it("turns block comments into encoded speaker notes", async () => {
    const html = await getPresentation(
      "## Slide\n\nvisible\n/*\nhidden note\n*/\n",
      {},
      [],
      {},
    );
    expect(html).not.toContain("hidden note");
    expect(html).toContain('class="sd-notes"');
    expect(html).toContain("visible");
  });

  it("expands the image directive", async () => {
    const html = await getPresentation(
      "## Slide\n\n!image(pic.png,alt text,300)\n",
      {},
      [],
      {},
    );
    expect(html).toContain("<img");
    expect(html).toContain("pic.png");
  });

  it("applies the formatting components", async () => {
    const html = await getPresentation("## Slide\n\n**bold**\n", {}, [], {});
    expect(html).toContain("<strong>bold</strong>");
  });

  it("runs the custom components in order", async () => {
    const html = await getPresentation(
      "## Slide\n\n[[shout]] and [[whisper]]\n",
      {},
      [
        `${fixture}/components/shout.mjs`,
        `${fixture}/themes/dark/components/whisper.mjs`,
      ],
      {},
    );
    expect(html).toContain("SHOUTED");
    expect(html).toContain("whispered");
  });

  it("renders a slide through the template named in its classes", async () => {
    const html = await getPresentation(
      "## Slide .[#box]\n\nbody text\n",
      {},
      [],
      { box: '<div class="box"><sd-title /><sd-content /></div>' },
    );
    expect(html).toContain('class="box"');
    expect(html).toContain("<h2>Slide </h2>");
    expect(html).toContain("body text");
  });

  it("keeps the extra classes on the section", async () => {
    const html = await getPresentation(
      "## Slide .[dark wide]\n\ntext\n",
      {},
      [],
      {},
    );
    expect(html).toContain('class="sd-slide dark wide"');
  });

  it("extracts the timer directives into data attributes", async () => {
    const html = await getPresentation(
      "## Slide\n\n//@[]90\n//@<30\n//// dropped\n\ntext\n",
      {},
      [],
      {},
    );
    expect(html).toContain('data-timer-slide="90"');
    expect(html).toContain('data-timer-checkpoint="30"');
    expect(html).not.toContain("dropped");
  });
});
