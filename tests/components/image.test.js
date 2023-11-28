// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import image from "../../src/components/image";

const data = `!image(myimage.png, alt text, 13, 12, float: left;)`;

test("image", () => {
  expect(image(data)).toEqual(
    '<div class="sd-img" style=" float: left;" >\n        <img src="myimage.png" loading="lazy" alt="alt text" width="13" height="12" />\n      </div>',
  );
});
