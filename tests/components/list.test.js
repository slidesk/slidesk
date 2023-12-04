// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import list from "../../src/components/list";

const data = `- test
-- test
- test
-- test
-- test`;

test("list ul", () => {
  expect(list(data, 0, "ul")).toEqual(
    "<ul><ul><li>test </li><ul><li>test </li></ul><li>test </li><ul><li>test </li><li>test </li></ul></ul></ul>",
  );
});

test("list ol", () => {
  expect(list(data.replace(/-/g, "."), 0, "ol")).toEqual(
    "<ol><ol><li>test </li><ol><li>test </li></ol><li>test </li><ol><li>test </li><li>test </li></ol></ol></ol>",
  );
});
