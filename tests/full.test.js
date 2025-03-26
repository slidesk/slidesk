// eslint-disable-next-line import/no-unresolved
import { test, expect } from "bun:test";
import Convert from "../src/core/Convert";

const options = {
  save: false,
  notes: true,
  timers: true,
  conf: "test",
};

const file = `${process.cwd()}/example/main.sdf`;

test("not found", async () => {
  expect(await Convert("", options)).toEqual({});
});

test("minimal", async () => {
  expect(
    await Convert(`${process.cwd()}/tests/main.sdf`, options),
  ).not.toBeNull();
});

test("snap full", async () => {
  expect(await Convert(file, options)).not.toBeNull();
});
