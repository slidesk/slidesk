import { test, expect } from "bun:test";
import slugify from "../../src/utils/slugify";

test("slugify", () => {
  expect(slugify("This is a slide's title")).toEqual("this-is-a-slides-title");
});
