// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import babelfish from "../src/core/babelfish";

const options = {
  save: false,
  notes: true,
  timers: true,
  conf: "test",
};

const file = `${process.cwd()}/example/main.sdf`;

test("not found", async () => {
  expect(await babelfish("", options)).toEqual({});
});

test("minimal", async () => {
  expect(
    await babelfish(`${process.cwd()}/tests/main.sdf`, options),
  ).not.toBeNull();
});

test("snap full", async () => {
  expect(await babelfish(file, options)).not.toBeNull();
});
