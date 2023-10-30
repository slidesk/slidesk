// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import image from "../../src/components/image";

const data = `!image(myimage.png)`;

test("image", () => {
  expect(image(data)).toEqual(
    '<div class="sd-img" style="width: auto;height: auto;">\n        <img src="myimage.png" loading="lazy" alt="undefined" />\n      </div>',
  );
});
