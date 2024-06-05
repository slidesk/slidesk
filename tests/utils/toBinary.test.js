import { test, expect } from "bun:test";
import toBinary from "../../src/utils/toBinary";

test("image", () => {
  expect(toBinary("This is a slide's title")).toEqual(
    "VABoAGkAcwAgAGkAcwAgAGEAIABzAGwAaQBkAGUAJwBzACAAdABpAHQAbABlAA==",
  );
});
