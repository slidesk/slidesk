import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import prepareSDF from "./prepareSDF";

const fixture = join(import.meta.dir, "../../__fixtures__/talk");

describe("prepareSDF", () => {
  it("extracts the configuration block and strips it from the content", async () => {
    const { config, content } = await prepareSDF(`${fixture}/main.sdf`);
    expect(config.css).toEqual(['<link rel="stylesheet" href="custom.css" />']);
    expect(config.js).toEqual(['<script src="custom.js"></script>']);
    expect(content).not.toContain("add_styles");
  });

  it("inlines the included slides in alphabetical order", async () => {
    const { content } = await prepareSDF(`${fixture}/main.sdf`);
    expect(content).toContain("## Welcome");
    expect(content).toContain("## Intro");
    expect(content).toContain("## More");
    expect(content.indexOf("## Intro")).toBeLessThan(
      content.indexOf("## More"),
    );
    expect(content).not.toContain("!include(");
  });

  it("returns an empty configuration when there is no config block", async () => {
    const { config, content } = await prepareSDF(
      `${fixture}/slides/01-intro.sdf`,
    );
    expect(config).toEqual({ css: [], js: [] });
    expect(content).toContain("Hello **world**");
  });
});
