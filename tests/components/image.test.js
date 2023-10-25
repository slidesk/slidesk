// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import image from "../../src/components/image";

const data = `!image(myimage.png)`;

test("image", () => {
  expect(image(data)).toEqual('<img src="myimage.png"  loading="lazy" />');
});
