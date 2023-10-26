// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import comments from "../../src/components/comments";

const data = `
  /*
  This is a comment
  */
`;

test("comments", () => {
  expect(comments(data)).toEqual(
    '\n  <aside class="sd-notes">  This is a comment<br/>  </aside>\n',
  );
});
