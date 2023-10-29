// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import list from "../../src/components/list";

const data = `- test
-- test
- test
-- test
-- test`;

test("list", () => {
  expect(list(data, 0)).toEqual(
    "<ul><ul><li>test </li><ul><li>test </li></ul><li>test </li><ul><li>test </li><li>test </li></ul></ul></ul>",
  );
});
