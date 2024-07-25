// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import comments from "../../src/components/comments";

const data = `
/*
This is a comment
*/

/*
This is a second comment
*/
`;

test("comments", () => {
  expect(comments(data)).toEqual(
    '<aside class="sd-notes"><br/>This is a comment<br/></aside>\n<aside class="sd-notes"><br/>This is a second comment<br/></aside>\n',
  );
});
